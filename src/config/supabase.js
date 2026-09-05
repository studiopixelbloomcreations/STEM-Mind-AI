import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const jsonStr = import.meta.env.VITE_SUPABASE_CONFIG;
  if (!jsonStr) {
    console.warn('VITE_SUPABASE_CONFIG environment variable is not defined.');
    return { url: '', anonKey: '' };
  }
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse VITE_SUPABASE_CONFIG JSON:', err);
    return { url: '', anonKey: '' };
  }
};

const { url, anonKey } = getSupabaseConfig();

if (!url || !anonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. Please verify VITE_SUPABASE_CONFIG env var.'
  );
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder');
export default supabase;
