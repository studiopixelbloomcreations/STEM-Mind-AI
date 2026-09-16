import { createServer } from 'vite';

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true },
});

const load = (p) => vite.ssrLoadModule(p);

console.log('----------------------------------------------------');
console.log('NEXLEARN PHASE 13: PINNED MODEL & SINGLE-ATTEMPT HONEST FAILURE TEST');
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
  const { PINNED_MODELS, getPinnedModel, getModelChain } = await load('/src/lib/ai/modelRegistry.ts');
  const { callWithFallback } = await load('/src/lib/ai/resilientModelCall.ts');
  const { generateFullSessionConcurrently, generateQuestionFromCouncil, explainWrongAnswer } = await load('/src/lib/api/harmony.ts');

  test('Registry: has pinned models configured for all capabilities',
    PINNED_MODELS.textGeneration === 'gemini-3.8-flash' &&
    PINNED_MODELS.vision === 'gemini-3.8-flash' &&
    PINNED_MODELS.liveVoice === 'gemini-3.1-flash-live' &&
    PINNED_MODELS.tts === 'gemini-3.1-flash-tts' &&
    PINNED_MODELS.transcription === 'gemini-3.5-transcribe-live',
    `textGen=${PINNED_MODELS.textGeneration}, liveVoice=${PINNED_MODELS.liveVoice}`
  );

  // 2. Test Speed: Direct lookup overhead is negligible (<1ms)
  const t0 = performance.now();
  const m1 = getPinnedModel('textGeneration');
  const t1 = performance.now();
  const m2 = getPinnedModel('textGeneration');
  const t2 = performance.now();
  const lookupTimeMs = t2 - t1;

  test('Speed: Pinned model lookup overhead is negligible (<1ms)',
    lookupTimeMs < 1,
    `lookup: ${lookupTimeMs.toFixed(3)}ms (model: ${m1})`
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

  // 3. Test Single-Call Execution: Successful call makes exactly ONE network request to pinned model
  const originalFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'test-key-phase-13';

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
              parts: [{ text: 'Calculated successfully by pinned model.' }],
            },
            finishReason: 'STOP',
          },
        ],
      }),
      text: async () => JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'Calculated successfully by pinned model.' }] } }],
      }),
    };
  };

  const successResult = await callWithFallback('textGeneration', {
    prompt: 'What is Newton second law?',
  });

  test('Single Attempt: Successful AI call makes exactly 1 request to pinned model',
    successResult.success === true &&
    successResult.modelUsed === 'gemini-3.8-flash' &&
    callCount === 1 &&
    modelsCalled[0] === 'gemini-3.8-flash' &&
    successResult.data === 'Calculated successfully by pinned model.',
    `modelUsed=${successResult.modelUsed}, requestsMade=${callCount}`
  );

  // 4. Test Single Failure: If pinned model fails, halts immediately without cascading
  let failureCallCount = 0;
  let failureModelsAttempted = [];
  globalThis.fetch = async (url, opts) => {
    failureCallCount++;
    const modelName = extractModelName(url, opts);
    failureModelsAttempted.push(modelName);

    return {
      ok: false,
      status: 503,
      json: async () => ({ error: 'Gemini service unavailable.' }),
      text: async () => JSON.stringify({
        error: { code: 503, message: 'Gemini service unavailable.' },
      }),
    };
  };

  const failureResult = await callWithFallback('textGeneration', {
    prompt: 'What is momentum?',
  });

  test('Single Failure: Rejects immediately on failure without cascading to other models',
    failureResult.success === false &&
    failureCallCount === 1 &&
    failureModelsAttempted.length === 1 &&
    failureModelsAttempted[0] === 'gemini-3.8-flash',
    `attemptsMade=${failureCallCount}, attemptedModels=[${failureModelsAttempted.join(', ')}]`
  );

  // 5. Test Full Session Honest Error Propagation When Model Fails (Phase 11/13)
  // When model fails, session generation must reject honestly with error rather than injecting fake static content
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

  // 6. Test Council Question Honest Error Propagation (Phase 11/13)
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

  // 7. Test Explanation Honest Error Propagation (Phase 11/13)
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
    console.log('\x1b[32mALL PINNED MODEL & HONEST FAILURE TESTS PASSED.\x1b[0m');
  } else {
    console.log('\x1b[31mSOME TESTS FAILED. CHECK LOGS ABOVE.\x1b[0m');
    process.exit(1);
  }
}
