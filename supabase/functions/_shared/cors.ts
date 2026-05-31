const DEFAULT_ALLOWED_ORIGINS = [
  'https://stemmindv1.vercel.app',
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

export const buildCorsHeaders = (request: Request): Record<string, string> => {
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

export const resolveCorsHeaders = buildCorsHeaders;

export const handleOptions = (request: Request) =>
  new Response(null, { status: 204, headers: buildCorsHeaders(request) });

export const jsonWithCors = (request: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(request),
      'Content-Type': 'application/json',
    },
  });

export const jsonResponse = jsonWithCors;
