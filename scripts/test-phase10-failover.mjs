import { createServer } from 'vite';

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true },
});

const load = (p) => vite.ssrLoadModule(p);

console.log('----------------------------------------------------');
console.log('NEXLEARN PHASE 10: RESILIENT MULTI-MODEL FAILOVER & FALLBACK TEST');
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
  const { MODEL_PREFERENCES, getModelChain } = await load('/src/lib/ai/modelRegistry.ts');
  const { callWithFallback } = await load('/src/lib/ai/resilientModelCall.ts');
  const { generateFullSessionConcurrently, generateQuestionFromCouncil, explainWrongAnswer } = await load('/src/lib/api/harmony.ts');

  test('Registry: has comprehensive model chains for all capabilities',
    MODEL_PREFERENCES.textGeneration.length >= 8 &&
    MODEL_PREFERENCES.liveVoice.length >= 3,
    `textGen=${MODEL_PREFERENCES.textGeneration.length}, liveVoice=${MODEL_PREFERENCES.liveVoice.length}`
  );

  // 2. Test Speed & In-Memory Caching (<10ms overhead)
  const t0 = performance.now();
  const chain1 = await getModelChain('textGeneration');
  const t1 = performance.now();
  const chain2 = await getModelChain('textGeneration');
  const t2 = performance.now();
  const cacheLookupTimeMs = t2 - t1;

  test('Speed: Model chain cache lookup overhead is negligible (<10ms)',
    cacheLookupTimeMs < 10,
    `cached lookup: ${cacheLookupTimeMs.toFixed(3)}ms`
  );

  // 3. Test Single-Model Failover Simulation: First model fails -> Next model succeeds
  const originalFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'test-key-phase-10';

  let callCount = 0;
  let modelsCalled = [];
  globalThis.fetch = async (url, opts) => {
    callCount++;
    const urlStr = String(url);
    const modelMatch = urlStr.match(/models\/([^:]+):generateContent/);
    const modelName = modelMatch ? modelMatch[1] : 'unknown';
    modelsCalled.push(modelName);

    if (callCount === 1) {
      // Simulate 404: model no longer available
      return {
        ok: false,
        status: 404,
        text: async () => JSON.stringify({
          error: {
            code: 404,
            message: `models/${modelName} is not found.`,
            status: 'NOT_FOUND',
          },
        }),
      };
    }

    // Second model succeeds
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Calculated successfully by failover model.' }],
            },
            finishReason: 'STOP',
          },
        ],
      }),
    };
  };

  const failoverResult = await callWithFallback('textGeneration', {
    prompt: 'What is Newton second law?',
  });

  test('Failover: First model 404 automatically falls over to next candidate without error',
    failoverResult.success === true &&
    failoverResult.modelUsed !== undefined &&
    failoverResult.data === 'Calculated successfully by failover model.',
    `modelUsed=${failoverResult.modelUsed}, attempts=${modelsCalled.length}`
  );

  // 4. Test Multi-Model Cycle: If one model fails, ALL available models in chain are attempted
  let allModelsAttempted = [];
  globalThis.fetch = async (url, opts) => {
    const urlStr = String(url);
    const modelMatch = urlStr.match(/models\/([^:]+):generateContent/);
    const modelName = modelMatch ? modelMatch[1] : 'unknown';
    allModelsAttempted.push(modelName);

    return {
      ok: false,
      status: 503,
      text: async () => JSON.stringify({
        error: { code: 503, message: 'Gemini service unavailable.' },
      }),
    };
  };

  const exhaustionResult = await callWithFallback('textGeneration', {
    prompt: 'What is momentum?',
  }, { totalTimeBudgetMs: 5000, perModelTimeoutMs: 500 });

  test('Multi-Model Coverage: All candidate models in chain were attempted on failure',
    allModelsAttempted.length >= 5 && exhaustionResult.success === false,
    `attempted ${allModelsAttempted.length} models: [${allModelsAttempted.slice(0, 4).join(', ')}...]`
  );

  // 5. Test Full Session Honest Error Propagation When All Models Fail (Phase 11 — A1)
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

  test('Honest Failure: Session generation rejects with clean error when all models fail (No fake questions)',
    sessionErrorThrew && sessionErrorMessage.includes('trouble reaching NexLearn\'s AI'),
    `error="${sessionErrorMessage}"`
  );

  // 6. Test Council Question Honest Error Propagation (Phase 11 — A1)
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

  // 7. Test Explanation Honest Error Propagation (Phase 11 — A1)
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

  // Restore fetch
  globalThis.fetch = originalFetch;

} catch (err) {
  console.error('Fatal error during test suite execution:', err);
  allPassed = false;
} finally {
  await vite.close();
  console.log('\n----------------------------------------------------');
  if (allPassed) {
    console.log('\x1b[32mALL MULTI-MODEL FAILOVER & FALLBACK TESTS PASSED.\x1b[0m');
  } else {
    console.log('\x1b[31mSOME TESTS FAILED. CHECK LOGS ABOVE.\x1b[0m');
    process.exit(1);
  }
}
