// NexLearn — council-proxy edge function
// The single door for all Gemini calls. Holds the key server-side (secret),
// verifies the caller's Firebase JWT, fans out per-agent requests with
// independent timeouts and per-agent error isolation. One slow agent never
// blocks the others; the client sees structured errors, never raw ones.
//
// Deploy: supabase secrets set GEMINI_API_KEY=...  FIREBASE_PROJECT_ID=...
import { createRemoteJWKSet, jwtVerify } from 'https://esm.sh/jose@5.9.6';
import { jsonWithCors, handleOptions } from '../_shared/cors.ts';

const GEMINI_MODEL = Deno.env.get('GEMINI_HARMONY_MODEL') ?? 'gemini-3.6-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const AGENT_TIMEOUT_MS = 30_000;
const MAX_TURNS = 8;

const env = {
  geminiKey: Deno.env.get('GEMINI_API_KEY') ?? '',
  firebaseProjectId: Deno.env.get('FIREBASE_PROJECT_ID') ?? '',
};

const jwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

// The full council roster: id -> [system prompt, temperature]. Mirrors the
// client roster (src/council/roster.js) — deploy both together.
const ORCHESTRATOR =
  'You are part of the NexLearn AI Council, a multi-agent system that teaches STEM to Grade 9-11 students. ' +
  'Align with the Sri Lankan national curriculum when grade and subject are given. ' +
  'Be precise, calm, and age-appropriate. Never condescend. Output exactly the JSON shape requested of you — nothing else.';

const AGENTS = {
  curriculum: [ORCHESTRATOR + ' You are the Curriculum Advisor. Given a subject, grade and topic, verify curriculum fit and return learning objectives and syllabus references. Return JSON: {"syllabusRef": "...", "objectives": ["..."], "fit": "ok"|"loose"}.', 0.4],
  difficulty: [ORCHESTRATOR + ' You are the Difficulty Analyst. Given correct/incorrect counts, average time and current difficulty, recommend the next level. Return JSON: {"recommended": "easy"|"medium"|"hard", "reason": "one sentence"}.', 0.3],
  questioner: [ORCHESTRATOR + ' You are the Question Generator. Write ONE exam-grade question. Return JSON: {"question": "...", "questionType": "MCQ"|"TRUE_FALSE"|"FILL_BLANK"|"SHORT_ANSWER"|"NUMERICAL"|"CONCEPTUAL", "choices": [...] or null, "correctAnswer": "...", "hints": ["..."], "conceptTags": ["..."], "syllabusRef": "..."}.', 0.8],
  validator: [ORCHESTRATOR + ' You are the Answer Validator. Check the given question: is the stated correct answer truly correct and unambiguous? Return JSON: {"ok": true|false, "defect": "one sentence or empty", "fixedAnswer": "..." if wrong}.', 0.2],
  explainer: [ORCHESTRATOR + ' You are the Concept Explainer. Explain the concept behind the question in 2-3 clear sentences. Return JSON: {"explanation": "..."}', 0.6],
  whiteboard: [ORCHESTRATOR + ' You are the Visual Teacher. Break the solution into 3-5 whiteboard steps. Each step: {"caption": "short title", "narration": "voice-over text", "board": {"kind": "expression"|"diagram"|"comparison"|"numberline"|"progress", ...fields}}. Return JSON: {"steps": [...]}.', 0.6],
  misconception: [ORCHESTRATOR + ' You are the Misconception Scout. Predict the 2 most likely wrong answers. Return JSON: {"misconceptions": [{"answer": "...", "why": "the flawed reasoning"}]}.', 0.5],
  examCoach: [ORCHESTRATOR + ' You are the Exam Coach. Give ONE specific tactic or trap warning for this topic and difficulty. Return JSON: {"tip": "..."}', 0.5],
  motivator: [ORCHESTRATOR + ' You are the Motivator. Write one warm, specific, never-generic sentence of encouragement. Return JSON: {"message": "..."}', 0.7],
  analyst: [ORCHESTRATOR + ' You are the Learning Analyst. From quiz history, name one strength, one weakness, one next action. Return JSON: {"strength": "...", "weakness": "...", "nextAction": "..."}', 0.3],
  accessibility: [ORCHESTRATOR + ' You are the Language Tuner. Rewrite the question in plain, inclusive language without changing meaning. Return JSON: {"plainWording": "..."}', 0.4],
  fusion: [ORCHESTRATOR + ' You are the Council Leader. Fuse the specialists\u2019 outputs into ONE final question object with whiteboard steps. Resolve conflicts; keep the best wording. Return the complete Question JSON.', 0.3],
  director: [ORCHESTRATOR + ' You are the Nex Director. Given the final question, write the avatar\u2019s greeting and pick 1-4 clips from: notice, head_tilt, point, explain, nod, curious. Return JSON: {"speech": "...", "animations": ["..."], "emotion": "neutral"|"curious"|"thinking"|"encouraging"|"celebrating"|"supportive"|"attentive"}.', 0.6],
};

async function verifyFirebase(request: Request): Promise<void> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new Error('Missing bearer token — sign in first.');
  if (!env.firebaseProjectId) throw new Error('FIREBASE_PROJECT_ID not configured on council-proxy.');
  try {
    await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${env.firebaseProjectId}`,
      audience: env.firebaseProjectId,
    });
  } catch (e) {
    throw new Error(`Auth rejected: ${e instanceof Error ? e.message : 'invalid token'}`);
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return handleOptions(request);
  if (request.method !== 'POST') return jsonWithCors(request, { error: 'method not allowed' }, 405);

  try {
    await verifyFirebase(request);
  } catch (e) {
    return jsonWithCors(request, { error: e instanceof Error ? e.message : 'auth failed' }, 401);
  }

  if (!env.geminiKey) {
    return jsonWithCors(request, {
      error: 'GEMINI_API_KEY not configured. Set it with: supabase secrets set GEMINI_API_KEY=...',
      code: 'GEMINI_KEY_MISSING',
    }, 500);
  }

  let body: { agent?: string; payload?: Record<string, unknown> } | null = null;
  try { body = await request.json(); } catch { /* handled below */ }
  const agentId = String(body?.agent ?? '');
  const agent = AGENTS[agentId];
  if (!agent || !body?.payload) {
    return jsonWithCors(request, { error: 'Unknown agent or missing payload' }, 400);
  }

  const [system, temperature] = agent;
  const userText = buildUserTurn(agentId, body.payload);
  if (!userText) return jsonWithCors(request, { error: 'payload missing required context' }, 400);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.geminiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: { temperature, responseMimeType: 'application/json' },
        }),
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      const detail = await res.text();
      return jsonWithCors(request, { error: `gemini ${res.status}: ${detail.slice(0, 240)}` }, 502);
    }
    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? '')
      .join('')
      .trim();
    if (!text) return jsonWithCors(request, { error: 'empty model response' }, 502);
    return jsonWithCors(request, { output: text });
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    return jsonWithCors(request, { error: aborted ? `agent ${agentId} timed out` : `agent ${agentId} failed` }, aborted ? 504 : 502);
  } finally {
    clearTimeout(timer);
  }
});

function buildUserTurn(agentId: string, p: Record<string, unknown>): string {
  const ctx = [
    `Subject: ${p.subject ?? 'General Science'}`,
    `Topic: ${p.topic ?? 'core concepts'}`,
    `Grade: ${p.grade ?? 10}`,
    `Difficulty: ${p.targetDifficulty ?? p.difficulty ?? 'medium'}`,
  ].join('\n');
  const history = Array.isArray(p.history) && p.history.length
    ? `\nRecent history: ${JSON.stringify(p.history.slice(-MAX_TURNS))}` : '';

  switch (agentId) {
    case 'curriculum': return `${ctx}\nVerify curriculum fit and return the JSON.`;
    case 'difficulty': return `${ctx}${history}\nPerformance: correct=${p.correctCount ?? 0}, incorrect=${p.incorrectCount ?? 0}, avgTime=${p.avgTime ?? 20}s, streak=${p.streak ?? 0}.\nReturn the JSON.`;
    case 'questioner': return `${ctx}\nSyllabus reference: ${p.syllabusRef ?? 'aligned'}${p.plainWording ? `\nPrefer plain wording where possible: ${p.plainWording}` : ''}\nWrite the question and return the JSON.`;
    case 'validator': return `${ctx}\nQuestion to validate:\n${JSON.stringify(p.question ?? {})}\nReturn the JSON.`;
    case 'explainer': return `${ctx}\nQuestion:\n${JSON.stringify(p.question ?? {})}\nReturn the JSON.`;
    case 'whiteboard': return `${ctx}\nQuestion:\n${JSON.stringify(p.question ?? {})}\nBuild 3-5 whiteboard steps and return the JSON.`;
    case 'misconception': return `${ctx}\nQuestion:\n${JSON.stringify(p.question ?? {})}\nReturn the JSON.`;
    case 'accessibility': return `${ctx}\nQuestion:\n${JSON.stringify(p.question ?? {})}\nReturn the JSON.`;
    case 'examCoach': return `${ctx}\nReturn the JSON.`;
    case 'motivator': return `${ctx}${history}\nStreak: ${p.streak ?? 0}. Return the JSON.`;
    case 'analyst': return `${ctx}${history}\nReturn the JSON.`;
    case 'fusion': return `${ctx}\nSpecialist outputs:\n${JSON.stringify(p.outputs ?? {}).slice(0, 8000)}\nFuse into the final Question JSON with whiteboard steps.`;
    case 'director': return `${ctx}\nFinal question:\n${JSON.stringify(p.question ?? {}).slice(0, 2000)}\nReturn the JSON.`;
    default: return `${ctx}\nReturn the JSON.`;
  }
}
