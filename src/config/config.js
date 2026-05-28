/**
 * Configuration manager for STEMMind AI.
 * Handles parsing and validation of Harmony API keys and settings.
 */

// Central environment configuration loader
const getAPIKeys = () => {
  const jsonStr = import.meta.env.VITE_PI_MODEL_API_KEYS_JSON || '{}';
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse VITE_PI_MODEL_API_KEYS_JSON env variable. Expected JSON format.', err);
    return {};
  }
};

export const API_KEYS = getAPIKeys();

export const getProviderKey = (provider) => {
  const keys = getAPIKeys();
  return keys[provider]?.apiKey || null;
};

export const validateProviderKeys = () => {
  const keys = getAPIKeys();
  const providers = ['openrouter', 'groq', 'mistral', 'huggingface', 'deepseek'];
  const status = {};
  
  providers.forEach(provider => {
    status[provider] = !!(keys[provider]?.apiKey);
  });
  
  return status;
};
