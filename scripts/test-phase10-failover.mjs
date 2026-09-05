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

  // 5. Test Full Session Graceful Fallback When All Models Fail
  // Under total model exhaustion / network outage, session generation must fallback so student is never stuck
  let progressUpdates = 0;
  const sessionQuestions = await generateFullSessionConcurrently(
    'Science',
    'Motion & Newton Laws',
    10,
    'medium',
    (completed, total) => {
      progressUpdates++;
    }
  );

  test('Fallback: Session generation returns complete 5 questions when all models fail',
    Array.isArray(sessionQuestions) && sessionQuestions.length === 5,
    `questionsCount=${sessionQuestions?.length}`
  );

  test('Fallback: Questions contain authentic choices, hints, approach notes, and teaching steps',
    sessionQuestions.every((q) =>
      q.question &&
      Array.isArray(q.choices) && q.choices.length === 4 &&
      q.correctAnswer &&
      q.hint &&
      q.howToApproach &&
      Array.isArray(q.teachingSteps) && q.teachingSteps.length >= 3
    ),
    '100% complete syllabus question structure verified'
  );

  // 6. Test Council Question Fallback
  const councilQuestion = await generateQuestionFromCouncil('Physics', 'Motion under gravity', 10, 'medium');
  test('Fallback: Council question generator returns valid syllabus fallback question',
    Boolean(councilQuestion && councilQuestion.question && councilQuestion.correctAnswer),
    `question="${councilQuestion?.question?.slice(0, 40)}..."`
  );

  // 7. Test Explanation Fallback
  const explanationSteps = await explainWrongAnswer('What is force?', 'Mass x Acceleration', 'Mass / Velocity');
  test('Fallback: Step explainer returns structured whiteboard teaching steps',
    Array.isArray(explanationSteps) && explanationSteps.length >= 2,
    `stepsCount=${explanationSteps.length}`
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
