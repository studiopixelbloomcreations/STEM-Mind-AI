import { auth } from '../config/firebase';
import { buildClientVisionAnalysis } from '../ml/transformersClient';
import { normalizeVisionResponse } from '../utils/visionValidation';

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

const ensureVisionEndpoint = () => {
  if (!url || !anonKey) {
    throw new Error('Vision service is not configured. Missing Supabase URL or anon key.');
  }
  return `${url}/functions/v1/vision-analyze`;
};

const buildHeaders = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You need to sign in before using camera analysis.');
  }
  const firebaseToken = await currentUser.getIdToken(true);
  return {
    'Content-Type': 'application/json',
    apikey: anonKey,
    Authorization: `Bearer ${firebaseToken}`,
    'x-client-info': 'stem-mind-ai-web',
  };
};

const callVisionFunction = async (payload) => {
  const endpoint = ensureVisionEndpoint();
  const headers = await buildHeaders();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'Vision service request failed.');
  }
  return data;
};

export const analyzeVisionImage = async ({
  studentId,
  subject,
  topic,
  fileName,
  mimeType,
  base64Image,
  imageFile = null,
}) => {
  const clientAnalysis = await buildClientVisionAnalysis({
    imageInput: imageFile || base64Image,
    subject,
    topic,
  });

  const response = await callVisionFunction({
    mode: 'analyze',
    studentId,
    context: { subject, topic },
    clientAnalysis,
    image: {
      sourceType: 'base64',
      fileName,
      mimeType,
      base64Data: base64Image,
    },
  });
  return normalizeVisionResponse(response);
};

export const fetchRecentVisionAttempts = async ({ studentId, limit = 5 }) => {
  const response = await callVisionFunction({
    mode: 'list',
    studentId,
    limit,
  });
  const attempts = Array.isArray(response.attempts) ? response.attempts : [];
  return attempts.map((attempt) => normalizeVisionResponse(attempt));
};
