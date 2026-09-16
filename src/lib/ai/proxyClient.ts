/**
 * NexLearn Supabase Edge Function Proxy Client (Phase 11 — A2)
 *
 * All Gemini AI interactions route exclusively through this proxy client to
 * the `council-proxy` Supabase Edge Function.
 * The client bundle holds ZERO raw Gemini API keys.
 */

export interface ProxyGenerateContentPayload {
  contents: any[];
  systemInstruction?: any;
  generationConfig?: any;
}

export interface ProxyResponse<T = any> {
  data?: T;
  error?: string;
  code?: string;
}

function getSupabaseConfig(): { url: string; anonKey: string } {
  const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_CONFIG : undefined;
  const procEnv = typeof process !== 'undefined' && process.env ? process.env.VITE_SUPABASE_CONFIG : undefined;
  const raw = metaEnv || procEnv;

  if (raw) {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed.url) {
        return {
          url: parsed.url.replace(/\/$/, ''),
          anonKey: parsed.anonKey || '',
        };
      }
    } catch {
      // Ignore parse failure
    }
  }

  return { url: '', anonKey: '' };
}

export function getProxyUrl(): string | null {
  const { url } = getSupabaseConfig();
  if (url) {
    return `${url}/functions/v1/council-proxy`;
  }
  return null;
}

let authTokenGetter: (() => Promise<string | null>) | null = null;
export function setProxyAuthGetter(fn: () => Promise<string | null>) {
  authTokenGetter = fn;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { anonKey } = getSupabaseConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (anonKey) {
    headers['apikey'] = anonKey;
  }

  let token: string | null = null;
  if (authTokenGetter) {
    try {
      token = await authTokenGetter();
    } catch {
      // Ignore auth provider error
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (anonKey) {
    headers['Authorization'] = `Bearer ${anonKey}`;
  }

  return headers;
}

/**
 * Executes a generateContent request through the server-side council-proxy.
 */
export async function proxyGenerateContent(
  model: string,
  payload: ProxyGenerateContentPayload,
  timeoutMs: number = 30000
): Promise<any> {
  const proxyUrl = getProxyUrl();

  // Test runner fallback (Node only, when no Supabase URL is set but testing with GEMINI_API_KEY)
  if (!proxyUrl) {
    const testKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY;
    if (testKey) {
      const cleanModel = model.replace(/^models\//, '');
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cleanModel)}:generateContent?key=${encodeURIComponent(testKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        const err: any = new Error(text);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    }
    throw new Error('Supabase Edge Function proxy is not configured (VITE_SUPABASE_CONFIG is missing).');
  }

  const headers = await getAuthHeaders();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'generateContent',
        model,
        contents: payload.contents,
        systemInstruction: payload.systemInstruction,
        generationConfig: payload.generationConfig,
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message = data?.error || `Proxy returned HTTP ${res.status}`;
      const err: any = new Error(typeof message === 'object' ? JSON.stringify(message) : message);
      err.status = res.status;
      err.code = data?.code;
      throw err;
    }

    return data;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      const timeoutErr: any = new Error(`Proxy request to model "${model}" timed out after ${timeoutMs}ms.`);
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Queries available models through the server-side proxy.
 */
export async function proxyListModels(timeoutMs: number = 8000): Promise<any[]> {
  const proxyUrl = getProxyUrl();
  if (!proxyUrl) {
    return [];
  }

  const headers = await getAuthHeaders();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'models.list' }),
      signal: controller.signal,
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.models) ? data.models : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Synthesizes audio through the server-side proxy.
 */
export async function proxySynthesizeTts(
  text: string,
  voice: string = 'Kore',
  model: string = 'gemini-3.1-flash-tts',
  timeoutMs: number = 30000
): Promise<any> {
  const proxyUrl = getProxyUrl();
  if (!proxyUrl) {
    throw new Error('Supabase Edge Function proxy is not configured.');
  }

  const headers = await getAuthHeaders();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'tts',
        model,
        text,
        voice,
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err: any = new Error(data?.error || `TTS proxy returned HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}
