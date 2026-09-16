import { createServer } from 'vite';

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true },
});

const load = (p) => vite.ssrLoadModule(p);

console.log('----------------------------------------------------');
console.log('NEXLEARN PHASE 14: BOUNDED CURRENT-GENERATION MODEL FAILOVER TEST');
console.log('----------------------------------------------------\n');

let allPassed = true;
const test = (title, pass, details = '') => {
  if (pass) {
    console.log(`\x1b[32m✔ PASS\x1b[0m ${title} ${details ? '(' + details + ')' : ''}`);
  } else {
    allPassed = false;
    console.error(`\x1b[31m✖ FAIL\x1b[0m ${title}: ${details}`);
  }
};

try {
  // Polyfill window / CustomEvent if running in Node SSR
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = {
      dispatchEvent: (event) => {
        globalThis._lastDispatchedEvent = event;
      },
    };
  }
  if (typeof globalThis.CustomEvent === 'undefined') {
    globalThis.CustomEvent = class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    };
  }

  // 1. Load Registry & Telemetry
  const { PINNED_MODELS, TEXT_GENERATION_CHAIN, getPinnedModel, getModelChain } = await load('/src/lib/ai/modelRegistry.ts');
  const { callWithFallback } = await load('/src/lib/ai/resilientModelCall.ts');
  const { generateFullSessionConcurrently, generateQuestionFromCouncil, explainWrongAnswer } = await load('/src/lib/api/harmony.ts');

  const textChain = getModelChain('textGeneration');
  test('Registry: has 4-model bounded chain for textGeneration and pinned models for other capabilities',
    Array.isArray(TEXT_GENERATION_CHAIN) &&
    TEXT_GENERATION_CHAIN.length === 4 &&
    TEXT_GENERATION_CHAIN[0] === 'gemini-3.8-flash' &&
    TEXT_GENERATION_CHAIN[1] === 'gemini-3.7-flash' &&
    TEXT_GENERATION_CHAIN[2] === 'gemini-3.6-flash' &&
    TEXT_GENERATION_CHAIN[3] === 'gemini-3.5-flash' &&
    textChain.join(',') === 'gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash' &&
    PINNED_MODELS.vision === 'gemini-3.8-flash' &&
    PINNED_MODELS.liveVoice === 'gemini-2.5-flash-native-audio-latest' &&
    PINNED_MODELS.tts === 'gemini-3.1-flash-tts' &&
    PINNED_MODELS.transcription === 'gemini-3.5-transcribe-live',
    `textGenChain=[${textChain.join(', ')}], liveVoice=${PINNED_MODELS.liveVoice}`
  );

  // 2. Test Speed: Direct lookup overhead is negligible (<1ms)
  const t0 = performance.now();
  const m1 = getPinnedModel('textGeneration');
  const t1 = performance.now();
  const m2 = getPinnedModel('textGeneration');
  const t2 = performance.now();
  const lookupTimeMs = t2 - t1;

  test('Speed: Model chain lookup overhead is negligible (<1ms)',
    lookupTimeMs < 1,
    `lookup: ${lookupTimeMs.toFixed(3)}ms (primary: ${m1})`
  );

  // Helper to extract requested model name from fetch arguments
  const extractModelName = (url, opts) => {
    if (opts?.body) {
      try {
        const b = typeof opts.body === 'string' ? JSON.parse(opts.body) : opts.body;
        if (b.model) return b.model;
      } catch {}
    }
    const urlStr = String(url);
    const modelMatch = urlStr.match(/models\/([^:]+):generateContent/);
    return modelMatch ? modelMatch[1] : 'unknown';
  };

  // 3. Test Primary Call Execution: Successful call resolves on primary model in 1 request
  const originalFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'test-key-phase-14';

  let callCount = 0;
  let modelsCalled = [];
  globalThis.fetch = async (url, opts) => {
    callCount++;
    const modelName = extractModelName(url, opts);
    modelsCalled.push(modelName);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Calculated successfully by primary model.' }],
            },
            finishReason: 'STOP',
          },
        ],
      }),
      text: async () => JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'Calculated successfully by primary model.' }] } }],
      }),
    };
  };

  const successResult = await callWithFallback('textGeneration', {
    prompt: 'What is Newton second law?',
  });

  test('Primary Success: Normal healthy call resolves on primary model in 1 request',
    successResult.success === true &&
    successResult.modelUsed === 'gemini-3.8-flash' &&
    callCount === 1 &&
    modelsCalled[0] === 'gemini-3.8-flash' &&
    successResult.data === 'Calculated successfully by primary model.',
    `modelUsed=${successResult.modelUsed}, requestsMade=${callCount}`
  );

  // 4. Test Retryable Failover: 503 high-demand on 3.8-flash fails over to 3.7-flash and succeeds
  let failoverCallCount = 0;
  let failoverModelsAttempted = [];
  globalThis.fetch = async (url, opts) => {
    failoverCallCount++;
    const modelName = extractModelName(url, opts);
    failoverModelsAttempted.push(modelName);

    if (modelName === 'gemini-3.8-flash') {
      return {
        ok: false,
        status: 503,
        json: async () => ({
          error: {
            code: 503,
            message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
            status: 'UNAVAILABLE',
          },
        }),
        text: async () => JSON.stringify({
          error: {
            code: 503,
            message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
            status: 'UNAVAILABLE',
          },
        }),
      };
    }

    // Next model (gemini-3.7-flash) succeeds
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Recovered via sibling current model.' }],
            },
            finishReason: 'STOP',
          },
        ],
      }),
      text: async () => JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'Recovered via sibling current model.' }] } }],
      }),
    };
  };

  const failoverResult = await callWithFallback('textGeneration', {
    prompt: 'What is momentum?',
  });

  test('Retryable Failover: 503 high-demand fails over to next model (gemini-3.7-flash) and succeeds',
    failoverResult.success === true &&
    failoverResult.modelUsed === 'gemini-3.7-flash' &&
    failoverCallCount === 2 &&
    failoverModelsAttempted[0] === 'gemini-3.8-flash' &&
    failoverModelsAttempted[1] === 'gemini-3.7-flash' &&
    failoverResult.data === 'Recovered via sibling current model.',
    `modelUsed=${failoverResult.modelUsed}, requestsMade=${failoverCallCount}, attempted=[${failoverModelsAttempted.join(', ')}]`
  );

  // 5. Test Non-Retryable Error: 400 Bad Request halts immediately without cascading
  let nonRetryCallCount = 0;
  let nonRetryModelsAttempted = [];
  globalThis.fetch = async (url, opts) => {
    nonRetryCallCount++;
    const modelName = extractModelName(url, opts);
    nonRetryModelsAttempted.push(modelName);

    return {
      ok: false,
      status: 400,
      json: async () => ({ error: { code: 400, message: 'Invalid payload argument' } }),
      text: async () => JSON.stringify({ error: { code: 400, message: 'Invalid payload argument' } }),
    };
  };

  const nonRetryResult = await callWithFallback('textGeneration', {
    prompt: 'Malformed input',
  });

  test('Non-Retryable Halt: 400 Bad Request halts immediately without cascading to remaining models',
    nonRetryResult.success === false &&
    nonRetryCallCount === 1 &&
    nonRetryModelsAttempted.length === 1 &&
    nonRetryModelsAttempted[0] === 'gemini-3.8-flash',
    `requestsMade=${nonRetryCallCount}, attempted=[${nonRetryModelsAttempted.join(', ')}]`
  );

  // 6. Test Full Chain Exhaustion: When all 4 models fail with 503, exhausts chain and returns honest failure
  let fullExhaustCallCount = 0;
  let fullExhaustModelsAttempted = [];
  globalThis.fetch = async (url, opts) => {
    fullExhaustCallCount++;
    const modelName = extractModelName(url, opts);
    fullExhaustModelsAttempted.push(modelName);

    return {
      ok: false,
      status: 503,
      json: async () => ({ error: { code: 503, message: 'High demand across capacity' } }),
      text: async () => JSON.stringify({ error: { code: 503, message: 'High demand across capacity' } }),
    };
  };

  const fullExhaustResult = await callWithFallback('textGeneration', {
    prompt: 'Exhaustion test prompt',
  });

  test('Full Chain Exhaustion: When all 4 models fail, exhausts chain and returns honest error',
    fullExhaustResult.success === false &&
    fullExhaustCallCount === 4 &&
    fullExhaustModelsAttempted.length === 4 &&
    fullExhaustModelsAttempted.join(',') === 'gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash',
    `requestsMade=${fullExhaustCallCount}, chain=[${fullExhaustModelsAttempted.join(' -> ')}]`
  );

  // 7. Test Full Session Honest Error Propagation When Chain Fails (Phase 11/13/14)
  // When all models fail, session generation must reject honestly with error rather than injecting fake static content
  let sessionErrorThrew = false;
  let sessionErrorMessage = '';
  try {
    await generateFullSessionConcurrently(
      'Science',
      'Motion & Newton Laws',
      10,
      'medium'
    );
  } catch (err) {
    sessionErrorThrew = true;
    sessionErrorMessage = err.message || '';
  }

  test('Honest Failure: Session generation rejects with clean error on failure (No fake questions)',
    sessionErrorThrew && sessionErrorMessage.includes('trouble reaching NexLearn\'s AI'),
    `error="${sessionErrorMessage}"`
  );

  // 8. Test Council Question Honest Error Propagation (Phase 11/13/14)
  let councilErrorThrew = false;
  let councilErrorMessage = '';
  try {
    await generateQuestionFromCouncil('Physics', 'Motion under gravity', 10, 'medium');
  } catch (err) {
    councilErrorThrew = true;
    councilErrorMessage = err.message || '';
  }

  test('Honest Failure: Council question generator rejects with clean error (No fake fallback questions)',
    councilErrorThrew && Boolean(councilErrorMessage),
    `error="${councilErrorMessage}"`
  );

  // 9. Test Explanation Honest Error Propagation (Phase 11/13/14)
  let explanationErrorThrew = false;
  let explanationErrorMessage = '';
  try {
    await explainWrongAnswer('What is force?', 'Mass x Acceleration', 'Mass / Velocity');
  } catch (err) {
    explanationErrorThrew = true;
    explanationErrorMessage = err.message || '';
  }

  test('Honest Failure: Step explainer rejects with clean error (No fake explanations)',
    explanationErrorThrew && Boolean(explanationErrorMessage),
    `error="${explanationErrorMessage}"`
  );

  // 10. Test Live Session Authentication Path (Phase 15 Section 1.2)
  const { getLiveSessionAuth } = await load('/src/lib/ai/proxyClient.ts');
  let liveAuthCalled = false;
  globalThis.fetch = async (url, opts) => {
    liveAuthCalled = true;
    return {
      ok: true,
      status: 200,
      json: async () => ({ key: 'test-live-key', endpoint: 'BidiGenerateContent' }),
      text: async () => JSON.stringify({ key: 'test-live-key', endpoint: 'BidiGenerateContent' }),
    };
  };

  const liveAuthResult = await getLiveSessionAuth();
  test('Live Auth: Server proxy mints live session credentials without client-side key exposure',
    liveAuthResult && Boolean(liveAuthResult.key || liveAuthResult.token) && liveAuthCalled,
    `endpoint=${liveAuthResult.endpoint}, mode=${liveAuthResult.key ? 'session-key' : 'token'}`
  );

  // Allow parallel worker promises and micro-staggers to settle under mock
  await new Promise((r) => setTimeout(r, 1200));

  // Restore fetch
  globalThis.fetch = originalFetch;

} catch (err) {
  console.error('Fatal error during test suite execution:', err);
  allPassed = false;
} finally {
  await vite.close();
  console.log('\n----------------------------------------------------');
  if (allPassed) {
    console.log('\x1b[32mALL PHASE 14 BOUNDED MODEL FAILOVER & HONEST FAILURE TESTS PASSED.\x1b[0m');
    process.exit(0);
  } else {
    console.log('\x1b[31mSOME TESTS FAILED. CHECK LOGS ABOVE.\x1b[0m');
    process.exit(1);
  }
}
