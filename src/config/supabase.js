import { createClient } from '@supabase/supabase-js';

export const getSupabaseConfig = () => {
  const jsonStr = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_CONFIG : undefined;
  if (jsonStr) {
    try {
      const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      if (parsed?.url) {
        return {
          url: parsed.url.replace(/\/$/, ''),
          anonKey: parsed.anonKey || '',
        };
      }
    } catch (err) {
      console.error('Failed to parse VITE_SUPABASE_CONFIG JSON:', err);
    }
  }

  // Also support individual env vars (e.g. Vercel standard environment variables)
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL)
    : undefined;
  const envKey = typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY)
    : undefined;

  if (envUrl) {
    return {
      url: envUrl.replace(/\/$/, ''),
      anonKey: envKey || '',
    };
  }

  // Fallback to active project URL
  return {
    url: 'https://jxhljizbivkrnpzwswce.supabase.co',
    anonKey: envKey || '',
  };
};

const { url, anonKey } = getSupabaseConfig();

export const supabase = createClient(
  url || 'https://jxhljizbivkrnpzwswce.supabase.co',
  anonKey || 'placeholder'
);
export default supabase;
