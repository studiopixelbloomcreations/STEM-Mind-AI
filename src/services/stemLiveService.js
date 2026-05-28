import { auth } from '../config/firebase';

const getSupabaseConfig = () => {
  const jsonStr = import.meta.env.VITE_SUPABASE_CONFIG;
  if (!jsonStr) return { url: '', anonKey: '' };
  try {
    return JSON.parse(jsonStr);
  } catch {
    return { url: '', anonKey: '' };
  }
};

const { url, anonKey } = getSupabaseConfig();
const REQUEST_TIMEOUT_MS = 18000;

const ensureEndpoint = () => {
  if (!url || !anonKey) {
    throw new Error('STEM Live is not configured. Missing Supabase URL or anon key.');
  }
  return `${url}/functions/v1/stem-live`;
};

const request = async (payload) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Please sign in before using STEM Live.');
  const idToken = await currentUser.getIdToken(true);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = performance.now();
  let response;
  try {
    response = await fetch(ensureEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${idToken}`,
        'x-client-info': 'stem-mind-ai-web',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('[REQUEST_TIMEOUT] STEM Live request timed out. Please check your connection.');
    }
    const message = error?.message || '';
    if (error instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(message)) {
      throw new Error(
        'STEM Live could not reach the server. Check your connection, or deploy the stem-live Supabase Edge Function if this is a new environment.'
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = data?.errorCode ? `[${data.errorCode}] ` : '';
    const serverMsg = data?.error || 'STEM Live request failed.';
    const deployHint =
      response.status === 404 || response.status === 502
        ? ' If the function is missing, deploy the stem-live Edge Function.'
        : '';
    throw new Error(`${code}${serverMsg}${deployHint}`);
  }
  return {
    ...data,
    _clientLatencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
  };
};

export const startStemLiveSession = async ({ studentId, context }) =>
  request({
    mode: 'start',
    studentId,
    context: context || {},
  });

export const sendStemLiveTurn = async ({
  sessionId,
  transcript,
  context,
  visionFrame,
  clientState,
}) =>
  request({
    mode: 'turn',
    sessionId,
    transcript,
    context: context || {},
    visionFrame: visionFrame || null,
    clientState: clientState || {},
  });

export const endStemLiveSession = async ({ sessionId }) =>
  request({
    mode: 'end',
    sessionId,
  });

export const heartbeatStemLiveSession = async ({ sessionId, clientState }) =>
  request({
    mode: 'heartbeat',
    sessionId,
    clientState: clientState || {},
  });
