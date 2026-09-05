import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { createRemoteJWKSet, jwtVerify } from 'https://esm.sh/jose@5.9.6';
import { handleOptions, jsonWithCors } from '../_shared/cors.ts';

type AnalyzeModePayload = {
  mode: 'analyze';
  studentId: string;
  context?: { subject?: string | null; topic?: string | null };
  clientAnalysis?: {
    extractedText?: string;
    confidence?: number;
    warnings?: string[];
    structuredSteps?: VisionStep[];
    summary?: string;
    caption?: string;
    detectedObjects?: Array<{ label: string; score: number }>;
    provider?: string;
  };
  image: {
    sourceType: 'base64' | 'storagePath';
    fileName?: string;
    mimeType?: string;
    base64Data?: string;
    storagePath?: string;
  };
};

type ListModePayload = {
  mode: 'list';
  studentId: string;
  limit?: number;
};

type VisionStep = { title: string; explanation: string };
type VisionResult = {
  extractedText: string;
  confidence: number;
  warnings: string[];
  structuredSteps: VisionStep[];
  summary: string;
  provider: string;
};

const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 7 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 18000;

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by Supabase at runtime.
// Do not add them as custom Edge Function secrets (names starting with SUPABASE_ are reserved).
const env = {
  supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
  supabaseServiceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  firebaseProjectId: Deno.env.get('FIREBASE_PROJECT_ID') ?? '',
  openrouterApiKey: Deno.env.get('OPENROUTER_API_KEY') ?? '',
  ocrSpaceApiKey: Deno.env.get('OCR_SPACE_API_KEY') ?? '',
  huggingfaceApiKey: Deno.env.get('HUGGINGFACE_API_KEY') ?? '',
};

const mustEnv = (value: string, name: string, hint?: string) => {
  if (!value) throw new Error(hint ?? `Missing env: ${name}`);
  return value;
};

const SUPABASE_AUTO_HINT =
  'expected to be auto-injected by Supabase; do not set as a custom secret';

let supabaseAdmin: SupabaseClient | null = null;

const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      mustEnv(env.supabaseUrl, 'SUPABASE_URL', `SUPABASE_URL ${SUPABASE_AUTO_HINT}`),
      mustEnv(
        env.supabaseServiceRoleKey,
        'SUPABASE_SERVICE_ROLE_KEY',
        `SUPABASE_SERVICE_ROLE_KEY ${SUPABASE_AUTO_HINT}`
      )
    );
  }
  return supabaseAdmin;
};

const firebaseJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

const withTimeout = async <T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> =>
  await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out.')), ms);
    }),
  ]);

const safeParseJson = async (request: Request) => {
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
  if (!uid) throw new Error('Invalid authentication token.');
  return { uid };
};

const ensureStudentOwnedByTeacher = async (studentId: string, teacherId: string) => {
  const { data, error } = await getSupabaseAdmin()
    .from('students')
    .select('id,teacher_id')
    .eq('id', studentId)
    .eq('teacher_id', teacherId)
    .maybeSingle();

  if (error) throw new Error('Failed to validate student ownership.');
  if (!data) throw new Error('Student not found for this teacher.');
};

const validateAnalyzePayload = (payload: unknown): AnalyzeModePayload => {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid JSON payload.');
  const parsed = payload as AnalyzeModePayload;
  if (parsed.mode !== 'analyze') throw new Error('Invalid mode.');
  if (!parsed.studentId || typeof parsed.studentId !== 'string') throw new Error('studentId is required.');
  if (!parsed.image || typeof parsed.image !== 'object') throw new Error('image payload is required.');
  if (!['base64', 'storagePath'].includes(parsed.image.sourceType)) {
    throw new Error('image.sourceType must be base64 or storagePath.');
  }
  if (parsed.image.sourceType === 'base64') {
    if (!parsed.image.base64Data || typeof parsed.image.base64Data !== 'string') {
      throw new Error('base64Data is required for sourceType=base64.');
    }
    if (!parsed.image.mimeType || !SUPPORTED_TYPES.has(parsed.image.mimeType)) {
      throw new Error('Unsupported mimeType.');
    }
  }
  if (parsed.image.sourceType === 'storagePath' && !parsed.image.storagePath) {
    throw new Error('storagePath is required for sourceType=storagePath.');
  }
  return parsed;
};

const validateListPayload = (payload: unknown): ListModePayload => {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid JSON payload.');
  const parsed = payload as ListModePayload;
  if (parsed.mode !== 'list') throw new Error('Invalid mode.');
  if (!parsed.studentId || typeof parsed.studentId !== 'string') throw new Error('studentId is required.');
  return parsed;
};

const base64ToBytes = (base64Data: string) => {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const uploadImageFromBase64 = async (teacherId: string, studentId: string, image: AnalyzeModePayload['image']) => {
  const base64Data = image.base64Data || '';
  const mimeType = image.mimeType || '';
  const fileName = image.fileName || `capture-${Date.now()}.jpg`;
  const bytes = base64ToBytes(base64Data);

  if (bytes.byteLength > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`Image exceeds ${MAX_IMAGE_SIZE_BYTES} bytes.`);
  }

  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${teacherId}/${studentId}/${Date.now()}-${safeName}.${ext}`;

  const { error } = await getSupabaseAdmin().storage.from('vision-captures').upload(path, bytes, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw new Error(`Failed to store image: ${error.message}`);

  return { path, mimeType, bytes };
};

const getImageBytesFromStoragePath = async (storagePath: string) => {
  const { data, error } = await getSupabaseAdmin().storage.from('vision-captures').download(storagePath);
  if (error) throw new Error('Unable to load image from storage path.');
  const bytes = new Uint8Array(await data.arrayBuffer());
  return bytes;
};

const tryOcrSpace = async (bytes: Uint8Array) => {
  if (!env.ocrSpaceApiKey) return null;
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  const form = new FormData();
  form.append('base64Image', `data:image/jpeg;base64,${btoa(binary)}`);
  form.append('language', 'eng');
  form.append('isOverlayRequired', 'false');
  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { apikey: env.ocrSpaceApiKey },
    body: form,
  });
  if (!response.ok) return null;
  const payload = await response.json();
  const text = payload?.ParsedResults?.[0]?.ParsedText;
  return typeof text === 'string' ? text.trim() : null;
};

const tryHuggingFaceOCR = async (bytes: Uint8Array) => {
  if (!env.huggingfaceApiKey) return null;
  const response = await fetch(
    'https://api-inference.huggingface.co/models/microsoft/trocr-base-printed',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.huggingfaceApiKey}`,
        'Content-Type': 'application/octet-stream',
      },
      body: bytes,
    }
  );
  if (!response.ok) return null;
  const payload = await response.json();
  if (Array.isArray(payload) && payload[0]?.generated_text) {
    return String(payload[0].generated_text).trim();
  }
  return null;
};

const extractText = async (bytes: Uint8Array) => {
  const warnings: string[] = [];

  try {
    const ocrSpaceText = await withTimeout(tryOcrSpace(bytes), REQUEST_TIMEOUT_MS);
    if (ocrSpaceText) return { text: ocrSpaceText, provider: 'ocr-space', warnings };
  } catch {
    warnings.push('OCR.space timed out or failed.');
  }

  try {
    const hfText = await withTimeout(tryHuggingFaceOCR(bytes), REQUEST_TIMEOUT_MS);
    if (hfText) return { text: hfText, provider: 'huggingface-trocr', warnings };
  } catch {
    warnings.push('Hugging Face OCR timed out or failed.');
  }

  warnings.push('No OCR provider configured or available. Returning low-confidence fallback.');
  return { text: '', provider: 'local-fallback', warnings };
};

const summarizeWithOpenRouter = async (text: string, context: { subject?: string | null; topic?: string | null }) => {
  if (!env.openrouterApiKey || !text) return null;
  const prompt = `You are an educational image analysis assistant.
Subject: ${context.subject || 'Unknown'}
Topic: ${context.topic || 'Unknown'}
Extracted OCR text:
${text}

Return strict JSON:
{
  "summary": "1-2 sentence understanding of the student's work",
  "confidence": 0-100 integer confidence,
  "warnings": ["warning text"],
  "structuredSteps": [
    {"title":"Step 1","explanation":"..."},
    {"title":"Step 2","explanation":"..."}
  ]
}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openrouterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen/qwen2.5-vl-72b-instruct:free',
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) return null;
  const body = await response.json();
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') return null;
  try {
    return JSON.parse(content.replace(/```json|```/g, '').trim());
  } catch {
    return null;
  }
};

const buildRuleBasedReasoning = (text: string, context: { subject?: string | null; topic?: string | null }): VisionResult => {
  const trimmed = text.trim();
  const hasText = trimmed.length > 0;
  const lines = hasText ? trimmed.split('\n').map((line) => line.trim()).filter(Boolean) : [];
  const steps: VisionStep[] = hasText
    ? [
        {
          title: 'Identify Problem',
          explanation: lines[0] || 'No clear prompt was detected in the first line.',
        },
        {
          title: 'Review Working',
          explanation: lines.slice(1, 4).join(' ') || 'No explicit working steps detected.',
        },
        {
          title: 'Teacher Guidance',
          explanation: `Verify calculations for ${context.topic || 'the selected topic'} and re-check units/signs.`,
        },
      ]
    : [
        {
          title: 'Improve Capture Quality',
          explanation: 'Retake the image with better lighting and keep all text in focus.',
        },
      ];

  return {
    extractedText: trimmed,
    confidence: hasText ? 62 : 20,
    warnings: hasText ? [] : ['No text detected from OCR.'],
    structuredSteps: steps,
    summary: hasText
      ? `Detected worksheet text for ${context.subject || 'the subject'}. Review the extracted steps and validate each calculation.`
      : 'Could not reliably detect text. Try another image with stronger contrast.',
    provider: 'local-fallback',
  };
};

const buildFromClientAnalysis = (
  clientAnalysis: NonNullable<AnalyzeModePayload['clientAnalysis']>,
  context: { subject?: string | null; topic?: string | null }
): VisionResult => {
  const extractedText = String(clientAnalysis.extractedText || '').trim();
  const summary = String(clientAnalysis.summary || '').trim();
  const warnings = Array.isArray(clientAnalysis.warnings) ? clientAnalysis.warnings.filter(Boolean) : [];
  const structuredSteps = Array.isArray(clientAnalysis.structuredSteps)
    ? clientAnalysis.structuredSteps.slice(0, 6).map((step, index) => ({
        title: step?.title || `Step ${index + 1}`,
        explanation: step?.explanation || '',
      }))
    : buildRuleBasedReasoning(extractedText, context).structuredSteps;

  return {
    extractedText,
    confidence: Number.isFinite(clientAnalysis.confidence)
      ? Math.max(0, Math.min(100, Number(clientAnalysis.confidence)))
      : extractedText
        ? 62
        : 20,
    warnings,
    structuredSteps,
    summary: summary || buildRuleBasedReasoning(extractedText, context).summary,
    provider: clientAnalysis.provider || 'transformers.js-client',
  };
};

const buildAnalysisResult = async (bytes: Uint8Array, context: { subject?: string | null; topic?: string | null }): Promise<VisionResult> => {
  const ocr = await extractText(bytes);
  const fallback = buildRuleBasedReasoning(ocr.text, context);
  fallback.provider = ocr.provider;
  fallback.warnings = [...fallback.warnings, ...ocr.warnings];

  if (!ocr.text) return fallback;

  try {
    const aiSummary = await withTimeout(summarizeWithOpenRouter(ocr.text, context), REQUEST_TIMEOUT_MS);
    if (aiSummary && Array.isArray(aiSummary.structuredSteps)) {
      return {
        extractedText: ocr.text,
        confidence: Number.isFinite(aiSummary.confidence) ? Math.max(0, Math.min(100, aiSummary.confidence)) : fallback.confidence,
        warnings: [...fallback.warnings, ...(Array.isArray(aiSummary.warnings) ? aiSummary.warnings.filter(Boolean) : [])],
        structuredSteps: aiSummary.structuredSteps.slice(0, 6).map((step: any, index: number) => ({
          title: step?.title || `Step ${index + 1}`,
          explanation: step?.explanation || '',
        })),
        summary: typeof aiSummary.summary === 'string' && aiSummary.summary.trim() ? aiSummary.summary.trim() : fallback.summary,
        provider: env.openrouterApiKey ? 'openrouter-qwen2.5-vl-free' : fallback.provider,
      };
    }
  } catch {
    fallback.warnings.push('Reasoning model unavailable. Returned rule-based guidance.');
  }

  return fallback;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  try {
    const { uid } = await verifyFirebaseAuth(request);
    const payload = await safeParseJson(request);
    if (!payload) return jsonWithCors(request, { error: 'Malformed JSON body.' }, 400);

    if (payload.mode === 'list') {
      const parsed = validateListPayload(payload);
      await ensureStudentOwnedByTeacher(parsed.studentId, uid);
      const limit = Math.min(Math.max(parsed.limit || 5, 1), 15);

      const { data, error } = await getSupabaseAdmin()
        .from('vision_attempts')
        .select('*')
        .eq('student_id', parsed.studentId)
        .eq('teacher_id', uid)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw new Error(`Unable to list attempts: ${error.message}`);

      return jsonWithCors(request, {
        attempts: (data || []).map((row: any) => ({
          attemptId: row.id,
          studentId: row.student_id,
          createdAt: row.created_at,
          analysis: {
            extractedText: row.extracted_text || '',
            confidence: Number(row.confidence) || 0,
            warnings: Array.isArray(row.warnings) ? row.warnings : [],
            structuredSteps: Array.isArray(row.structured_steps) ? row.structured_steps : [],
            summary: row.summary || '',
            provider: row.provider || 'local-fallback',
          },
        })),
      });
    }

    const parsed = validateAnalyzePayload(payload);
    await ensureStudentOwnedByTeacher(parsed.studentId, uid);

    let imagePath = '';
    let mimeType = parsed.image.mimeType || 'image/jpeg';
    let bytes: Uint8Array;

    if (parsed.image.sourceType === 'base64') {
      const uploaded = await uploadImageFromBase64(uid, parsed.studentId, parsed.image);
      imagePath = uploaded.path;
      mimeType = uploaded.mimeType;
      bytes = uploaded.bytes;
    } else {
      imagePath = parsed.image.storagePath || '';
      bytes = await getImageBytesFromStoragePath(imagePath);
    }

    const analysis = parsed.clientAnalysis
      ? buildFromClientAnalysis(parsed.clientAnalysis, parsed.context || {})
      : await buildAnalysisResult(bytes, parsed.context || {});

    const { data: inserted, error: insertError } = await getSupabaseAdmin()
      .from('vision_attempts')
      .insert({
        teacher_id: uid,
        student_id: parsed.studentId,
        subject: parsed.context?.subject || null,
        topic: parsed.context?.topic || null,
        image_path: imagePath,
        image_mime_type: mimeType,
        extracted_text: analysis.extractedText,
        confidence: analysis.confidence,
        warnings: analysis.warnings,
        structured_steps: analysis.structuredSteps,
        summary: analysis.summary,
        provider: analysis.provider,
      })
      .select('*')
      .single();

    if (insertError) throw new Error(`Failed to save attempt: ${insertError.message}`);

    return jsonWithCors(request, {
      attemptId: inserted.id,
      studentId: inserted.student_id,
      createdAt: inserted.created_at,
      analysis,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unhandled error.';
    const isAuthError =
      message.includes('bearer token') ||
      message.includes('authentication') ||
      message.includes('Invalid authentication') ||
      message.includes('FIREBASE_PROJECT_ID');
    return jsonWithCors(request, { error: message }, isAuthError ? 401 : 500);
  }
});
