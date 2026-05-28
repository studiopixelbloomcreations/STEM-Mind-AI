/**
 * Paste-ready bundle for Supabase Dashboard → Edge Functions.
 * Project: jxhljizbivkrnpzwswce | Function slug must match filename (without .ts).
 * Generated from supabase/functions/<name>/index.ts + inlined cors.ts — do not edit in repo and paste; re-run generator or copy from functions/ if you change logic.
 */
// --- CORS (inlined for Supabase Dashboard single-file deploy) ---
const DEFAULT_ALLOWED_ORIGINS = [
  'https://stemmindv1.netlify.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
];

const extraOrigins = (Deno.env.get('CORS_ALLOWED_ORIGINS') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin: string) => {
  if (!origin) return false;
  const allowed = [...DEFAULT_ALLOWED_ORIGINS, ...extraOrigins];
  if (allowed.includes(origin)) return true;
  if (origin.endsWith('.netlify.app')) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
};

const buildCorsHeaders = (request: Request): Record<string, string> => {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = isAllowedOrigin(origin) ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-requested-with, accept, x-supabase-api-version',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
};

const handleOptions = (request: Request) =>
  new Response(null, { status: 204, headers: buildCorsHeaders(request) });

const jsonWithCors = (request: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(request),
      'Content-Type': 'application/json',
    },
  });
// --- end CORS ---
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { createRemoteJWKSet, jwtVerify } from 'https://esm.sh/jose@5.9.6';

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by Supabase at runtime.
// Do not add them as custom Edge Function secrets (names starting with SUPABASE_ are reserved).
const env = {
  supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
  supabaseServiceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  firebaseProjectId: Deno.env.get('FIREBASE_PROJECT_ID') ?? '',
  openrouterApiKey: Deno.env.get('OPENROUTER_API_KEY') ?? '',
};

const SUPABASE_AUTO_HINT =
  'expected to be auto-injected by Supabase; do not set as a custom secret';
const MAX_FRAME_BYTES = 550_000;

let supabaseClient: SupabaseClient | null = null;

const getSupabase = () => {
  if (supabaseClient) return supabaseClient;
  if (!env.supabaseUrl) throw new Error(`SUPABASE_URL ${SUPABASE_AUTO_HINT}`);
  if (!env.supabaseServiceRoleKey) {
    throw new Error(`SUPABASE_SERVICE_ROLE_KEY ${SUPABASE_AUTO_HINT}`);
  }
  supabaseClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
  return supabaseClient;
};

const firebaseJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const json = (request: Request, body: unknown, status = 200) => jsonWithCors(request, body, status);

const safeJson = async (request: Request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const verifyFirebaseAuth = async (request: Request) => {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  if (!token) throw new Error('Missing bearer token.');
  if (!env.firebaseProjectId) throw new Error('FIREBASE_PROJECT_ID is not configured.');
  const verification = await jwtVerify(token, firebaseJwks, {
    issuer: `https://securetoken.google.com/${env.firebaseProjectId}`,
    audience: env.firebaseProjectId,
  });
  const uid = String(verification.payload.sub || '');
  if (!uid) throw new Error('Invalid auth token.');
  return { uid };
};

const ensureStudentOwnedByTeacher = async (studentId: string, teacherId: string) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('students')
    .select('id,teacher_id')
    .eq('id', studentId)
    .eq('teacher_id', teacherId)
    .maybeSingle();
  if (error) throw new Error(`Failed to validate student ownership: ${error.message}`);
  if (!data) throw new Error('Student not found for this teacher.');
};

const sanitizeText = (input: unknown) => String(input || '').replace(/\s+/g, ' ').trim().slice(0, 6000);
const safeObject = (input: unknown) => (input && typeof input === 'object' ? input : {});

const logSessionEvent = async (
  sessionId: string,
  teacherId: string,
  eventType: string,
  payload: Record<string, unknown> = {}
) => {
  const supabase = getSupabase();
  const { error } = await supabase.from('live_session_events').insert({
    session_id: sessionId,
    teacher_id: teacherId,
    event_type: eventType,
    payload,
  });
  if (error) console.error('live_session_events insert failed', error.message);
};

const validateVisionFrame = (visionFrame: { mimeType?: string; base64Data?: string; capturedAt?: string } | null) => {
  if (!visionFrame?.base64Data) return null;
  const mimeType = visionFrame.mimeType || 'image/jpeg';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) return null;
  const bytes = Math.ceil((visionFrame.base64Data.length * 3) / 4);
  if (bytes > MAX_FRAME_BYTES) return null;
  return {
    mimeType,
    base64Data: visionFrame.base64Data,
    capturedAt: visionFrame.capturedAt || new Date().toISOString(),
  };
};

const runOpenRouterText = async (systemPrompt: string, userPrompt: string, maxTokens = 300) => {
  if (!env.openrouterApiKey) return null;
  const models = ['meta-llama/llama-3.3-70b-instruct:free', 'openai/gpt-4o-mini'];
  for (const model of models) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: maxTokens,
      }),
    });
    if (!response.ok) continue;
    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text === 'string' && text.trim()) {
      return sanitizeText(text);
    }
  }
  return null;
};

const generateWelcomeMessage = async (params: {
  studentName?: string | null;
  subject?: string | null;
  topic?: string | null;
}) => {
  const studentName = params.studentName || 'there';
  const subject = params.subject || 'STEM';
  const topic = params.topic || 'your current lesson';
  const systemPrompt =
    'You are STEM Live by STEM Mind AI. Write one warm spoken welcome sentence (max 28 words). Be encouraging and natural. Do not mention microphones, buttons, or UI.';
  const userPrompt = `Welcome ${studentName} to a live tutoring session for ${subject} on ${topic}.`;
  const aiWelcome = await runOpenRouterText(systemPrompt, userPrompt, 80);
  if (aiWelcome) return aiWelcome;
  return `Welcome back, ${studentName}. Ready to explore ${topic} in ${subject} together?`;
};

const runOpenRouterConversation = async (params: {
  transcript: string;
  subject?: string | null;
  topic?: string | null;
  studentName?: string | null;
  visionFrame?: { mimeType?: string; base64Data?: string; capturedAt?: string } | null;
}) => {
  if (!env.openrouterApiKey) return null;
  const dataUrl =
    params.visionFrame?.base64Data && params.visionFrame?.mimeType
      ? `data:${params.visionFrame.mimeType};base64,${params.visionFrame.base64Data}`
      : null;
  const systemPrompt =
    'You are STEM Live by STEM Mind AI. Be friendly, concise, and pedagogical. Speak naturally. Keep replies under 90 words unless asked for depth. Refuse unsafe, harmful, sexual, violent, or self-harm guidance and redirect to safe educational support.';
  const userPrompt = `Student: ${params.studentName || 'Student'}
Subject: ${params.subject || 'General STEM'}
Topic: ${params.topic || 'None provided'}
User said: ${params.transcript}
If visual context exists, ground your reply in it.`;
  const content = dataUrl
    ? [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: dataUrl } },
      ]
    : userPrompt;
  const models = dataUrl
    ? ['qwen/qwen2.5-vl-72b-instruct:free', 'openai/gpt-4o-mini']
    : ['meta-llama/llama-3.3-70b-instruct:free', 'openai/gpt-4o-mini'];
  for (const model of models) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content },
        ],
        temperature: 0.4,
        max_tokens: 300,
      }),
    });
    if (!response.ok) continue;
    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text === 'string' && text.trim()) {
      return { text: sanitizeText(text), provider: `openrouter:${model}` };
    }
  }
  return null;
};

const fallbackReply = (transcript: string, subject?: string | null, topic?: string | null) => {
  const stemArea = topic || subject || 'this STEM concept';
  return `I heard: "${transcript}". Let us work through ${stemArea} step by step. Tell me what part feels hardest right now and I will adapt the explanation.`;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return handleOptions(request);

  try {
    const { uid } = await verifyFirebaseAuth(request);
    const body = await safeJson(request);
    if (!body || typeof body !== 'object') {
      return json(request, { errorCode: 'INVALID_JSON', error: 'Malformed JSON body.' }, 400);
    }
    const mode = String((body as Record<string, unknown>).mode || '');
    if (!['start', 'turn', 'end', 'heartbeat'].includes(mode)) {
      return json(request, { errorCode: 'INVALID_MODE', error: 'mode must be start, turn, end, or heartbeat.' }, 400);
    }

    const supabase = getSupabase();

    if (mode === 'start') {
      const studentId = String((body as any).studentId || '');
      if (!studentId) return json(request, { errorCode: 'MISSING_STUDENT_ID', error: 'studentId is required.' }, 400);
      await ensureStudentOwnedByTeacher(studentId, uid);
      const context = ((body as any).context || {}) as Record<string, unknown>;
      const { data, error } = await supabase
        .from('live_sessions')
        .insert({
          teacher_id: uid,
          student_id: studentId,
          subject: context.subject || null,
          topic: context.topic || null,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (error) {
        return json(request, { errorCode: 'SESSION_CREATE_FAILED', error: error.message }, 500);
      }
      await logSessionEvent(data.id, uid, 'session_started', { context });
      const welcomeMessage = await generateWelcomeMessage({
        studentName: context.studentName as string,
        subject: context.subject as string,
        topic: context.topic as string,
      });
      return json(request, {
        sessionId: data.id,
        startedAt: new Date().toISOString(),
        welcomeMessage,
      });
    }

    if (mode === 'end') {
      const sessionId = String((body as any).sessionId || '');
      if (!sessionId) return json(request, { errorCode: 'MISSING_SESSION_ID', error: 'sessionId is required.' }, 400);
      const { error } = await supabase
        .from('live_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('teacher_id', uid);
      if (error) return json(request, { errorCode: 'SESSION_END_FAILED', error: error.message }, 500);
      await logSessionEvent(sessionId, uid, 'session_ended');
      return json(request, { ok: true });
    }

    if (mode === 'heartbeat') {
      const sessionId = String((body as any).sessionId || '');
      if (!sessionId) return json(request, { errorCode: 'MISSING_SESSION_ID', error: 'sessionId is required.' }, 400);
      const { data: session } = await supabase
        .from('live_sessions')
        .select('id,status')
        .eq('id', sessionId)
        .eq('teacher_id', uid)
        .maybeSingle();
      if (!session) return json(request, { errorCode: 'SESSION_NOT_FOUND', error: 'Session not found.' }, 404);
      if (session.status !== 'active') return json(request, { errorCode: 'SESSION_INACTIVE', error: 'Session inactive.' }, 409);
      await logSessionEvent(sessionId, uid, 'heartbeat', safeObject((body as any).clientState) as Record<string, unknown>);
      return json(request, { ok: true, status: 'active', serverTime: new Date().toISOString() });
    }

    const turnStarted = Date.now();
    const sessionId = String((body as any).sessionId || '');
    const transcript = sanitizeText((body as any).transcript || '');
    if (!sessionId) return json(request, { errorCode: 'MISSING_SESSION_ID', error: 'sessionId is required.' }, 400);
    if (!transcript) return json(request, { errorCode: 'MISSING_TRANSCRIPT', error: 'transcript is required.' }, 400);

    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('id,teacher_id,subject,topic,status')
      .eq('id', sessionId)
      .eq('teacher_id', uid)
      .maybeSingle();
    if (sessionError || !session) {
      return json(request, { errorCode: 'SESSION_NOT_FOUND', error: 'Session not found.' }, 404);
    }
    if (session.status !== 'active') {
      return json(request, { errorCode: 'SESSION_INACTIVE', error: 'Session is not active.' }, 400);
    }

    const context = ((body as any).context || {}) as Record<string, unknown>;
    const rawVisionFrame = ((body as any).visionFrame || null) as
      | { mimeType?: string; base64Data?: string; capturedAt?: string }
      | null;
    const visionFrame = validateVisionFrame(rawVisionFrame);
    const providerReply = await runOpenRouterConversation({
      transcript,
      subject: (context.subject as string) || session.subject,
      topic: (context.topic as string) || session.topic,
      studentName: context.studentName as string,
      visionFrame,
    });
    const replyText =
      providerReply?.text ||
      fallbackReply(transcript, (context.subject as string) || session.subject, (context.topic as string) || session.topic);

    const visionSummary = visionFrame?.base64Data
      ? `Vision frame used (${visionFrame.capturedAt || 'now'}).`
      : 'Voice-only turn.';
    const provider = providerReply?.provider || 'local-fallback';
    const latencyMs = Date.now() - turnStarted;
    const clientState = safeObject((body as any).clientState);

    const { error: turnError } = await supabase.from('live_turns').insert({
      session_id: sessionId,
      teacher_id: uid,
      user_utterance: transcript,
      assistant_reply: replyText,
      vision_context: visionFrame
        ? {
            hasFrame: true,
            mimeType: visionFrame.mimeType || 'image/jpeg',
            capturedAt: visionFrame.capturedAt || null,
          }
        : { hasFrame: false },
      provider,
      metadata: {
        ...clientState,
        latencyMs,
      },
    });
    if (turnError) return json(request, { errorCode: 'TURN_PERSIST_FAILED', error: turnError.message }, 500);
    await logSessionEvent(sessionId, uid, 'turn_processed', {
      provider,
      latencyMs,
      hasVision: Boolean(visionFrame?.base64Data),
    });

    return json(request, {
      replyText,
      ttsText: replyText,
      provider,
      visionSummary,
      latencyMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unhandled server error.';
    const isAuthError =
      message.includes('bearer token') ||
      message.includes('auth token') ||
      message.includes('FIREBASE_PROJECT_ID');
    return json(
      request,
      {
        errorCode: isAuthError ? 'UNAUTHORIZED' : 'UNHANDLED',
        error: message,
      },
      isAuthError ? 401 : 500
    );
  }
});
