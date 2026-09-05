import { createServer } from 'vite';

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true },
});

const load = (p) => vite.ssrLoadModule(p);

console.log('----------------------------------------------------');
console.log('NEXLEARN PHASE 10: RESILIENT MULTI-MODEL FAILOVER TEST');
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
  const { MODEL_PREFERENCES, getModelChain, invalidateModelRegistryCache } = await load('/src/lib/ai/modelRegistry.ts');
  const { reportModelFailover, reportTotalChainExhaustion } = await load('/src/lib/ai/telemetry.ts');
  const { callWithFallback } = await load('/src/lib/ai/resilientModelCall.ts');

  test('Registry: has defined model chains for all capabilities',
    MODEL_PREFERENCES.textGeneration.length > 1 &&
    MODEL_PREFERENCES.liveVoice.length > 1 &&
    MODEL_PREFERENCES.tts.length > 1 &&
    MODEL_PREFERENCES.transcription.length > 1 &&
    MODEL_PREFERENCES.vision.length > 1,
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
  test('Registry: Returns valid candidate chain for textGeneration',
    Array.isArray(chain1) && chain1.length > 0 && chain1[0].includes('gemini'),
    `primary: ${chain1[0]}`
  );

  // 3. Test Single-Model Failover Simulation
  // We mock global fetch to simulate: First model returns 404 (deprecated), Second model returns valid response
  const originalFetch = globalThis.fetch;
  const failoverEvents = [];
  globalThis.window.addEventListener?.('ai-model-failover-event', (e) => {
    failoverEvents.push(e.detail);
  });

  // Set mock API key in environment
  process.env.VITE_GEMINI_API_KEY = 'test-key-phase-10';

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
            message: `models/${modelName} is not found for API version v1beta, or is not supported for generateContent.`,
            status: 'NOT_FOUND',
          },
        }),
      };
    }

    // Second call succeeds
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Calculated successfully by resilient failover model.' }],
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

  test('Failover: First model 404 automatically falls over to second candidate without error',
    failoverResult.success === true &&
    failoverResult.modelUsed !== undefined &&
    failoverResult.data === 'Calculated successfully by resilient failover model.',
    `modelUsed=${failoverResult.modelUsed}, attempts=${modelsCalled.length}`
  );

  // 4. Test Total Chain Exhaustion Simulation
  let exhaustionEvents = [];
  globalThis.window.addEventListener?.('ai-total-chain-exhaustion-alert', (e) => {
    exhaustionEvents.push(e.detail);
  });

  // All candidate models fail with 503 Service Unavailable
  globalThis.fetch = async (url, opts) => {
    return {
      ok: false,
      status: 503,
      text: async () => JSON.stringify({
        error: { code: 503, message: 'Google Gemini service currently unavailable.' },
      }),
    };
  };

  const exhaustionResult = await callWithFallback('textGeneration', {
    prompt: 'What is photosynthesis?',
  });

  test('Exhaustion: Returns { success: false } when all candidate models fail',
    exhaustionResult.success === false && exhaustionResult.errorType === 'TOTAL_CHAIN_EXHAUSTION',
    `errorType=${exhaustionResult.errorType}`
  );

  test('Exhaustion: Zero fake/mock content returned (honest failure guarantee)',
    exhaustionResult.data === undefined &&
    typeof exhaustionResult.error === 'string' &&
    exhaustionResult.attemptedModels.length > 1,
    `attemptedModels=${exhaustionResult.attemptedModels.join(', ')}`
  );

  // 5. Test Non-Retryable Error Halt (e.g. 400 Bad Request or Safety Block)
  let nonRetryableCallCount = 0;
  globalThis.fetch = async (url, opts) => {
    nonRetryableCallCount++;
    return {
      ok: false,
      status: 400,
      text: async () => JSON.stringify({
        error: { code: 400, message: 'Request contains invalid parameters.' },
      }),
    };
  };

  const badRequestResult = await callWithFallback('textGeneration', {
    prompt: 'Invalid prompt test',
  });

  test('Classification: 400 Bad Request halts immediately without failing over across chain',
    badRequestResult.success === false &&
    badRequestResult.errorType === 'BAD_REQUEST_400' &&
    nonRetryableCallCount === 1,
    `calls=${nonRetryableCallCount} (expected exactly 1)`
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
    console.log('\x1b[32mALL PHASE 10 VERIFICATION TESTS PASSED SUCCESSFULLY.\x1b[0m');
  } else {
    console.log('\x1b[31mSOME TESTS FAILED. CHECK LOGS ABOVE.\x1b[0m');
    process.exit(1);
  }
}
