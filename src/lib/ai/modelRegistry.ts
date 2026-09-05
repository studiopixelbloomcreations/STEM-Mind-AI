/**
 * Layer 1 — Model Registry (Phase 10)
 * Maintains live available model lists, verified capability preference order,
 * in-memory caching, and cross-referencing against Google's models.list endpoint.
 */

import { AICapability } from './telemetry';
import { getGeminiApiKey } from './apiKey';

/**
 * Verified model preference order per capability.
 * Order: Most-preferred (fastest, most capable, cost-effective) first.
 */
export const MODEL_PREFERENCES: Record<AICapability, string[]> = {
  textGeneration: [
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.5-pro',
    'gemini-pro',
    'gemini-1.0-pro',
  ],
  liveVoice: [
    'gemini-3.1-flash-live',
    'gemini-2.5-flash-native-audio-preview-12-2025',
    'gemini-2.5-flash-native-audio-preview-09-2025',
    'gemini-2.0-flash-exp',
  ],
  tts: [
    'gemini-3.1-flash-tts',
    'gemini-2.5-flash-preview-tts',
  ],
  transcription: [
    'gemini-3.5-transcribe-live-preview',
    'gemini-2.5-flash-native-audio-preview-12-2025',
  ],
  vision: [
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ],
};

const REGISTRY_CACHE_KEY = 'nexlearn_model_registry_cache_v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

interface RegistryCacheEntry {
  timestamp: number;
  availableModels: string[];
  chains: Record<AICapability, string[]>;
}

// In-memory cache for synchronous zero-latency lookups
let inMemoryRegistry: RegistryCacheEntry | null = null;
let isRefreshing = false;

/**
 * Normalizes a model identifier by removing leading models/ prefix.
 */
function normalizeModelId(id: string): string {
  return id.replace(/^models\//, '').trim().toLowerCase();
}

/**
 * Loads registry cache from localStorage/sessionStorage.
 */
function loadPersistedCache(): RegistryCacheEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(REGISTRY_CACHE_KEY) || localStorage.getItem(REGISTRY_CACHE_KEY);
    if (!raw) return null;
    const parsed: RegistryCacheEntry = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
      return parsed;
    }
  } catch {
    // Ignore cache parse failures
  }
  return null;
}

/**
 * Saves registry cache to memory and storage.
 */
function saveRegistryCache(availableModels: string[], chains: Record<AICapability, string[]>): void {
  const entry: RegistryCacheEntry = {
    timestamp: Date.now(),
    availableModels,
    chains,
  };
  inMemoryRegistry = entry;

  if (typeof window !== 'undefined') {
    try {
      const serialized = JSON.stringify(entry);
      sessionStorage.setItem(REGISTRY_CACHE_KEY, serialized);
      localStorage.setItem(REGISTRY_CACHE_KEY, serialized);
    } catch {
      // Ignore storage quota errors
    }
  }
}

/**
 * Fetches the live list of models this API key currently has access to.
 */
export async function fetchLiveAvailableModels(): Promise<string[]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return [];
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      console.warn(`[ModelRegistry] Live models.list responded with ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (Array.isArray(data?.models)) {
      const models = data.models.map((m: any) => normalizeModelId(m.name || ''));
      return models.filter((m: string) => Boolean(m));
    }
  } catch (err) {
    console.warn('[ModelRegistry] Failed to fetch live models.list:', err);
  }

  return [];
}

/**
 * Re-validates the model registry against Google's live models.list endpoint.
 */
export async function refreshModelRegistry(): Promise<void> {
  if (isRefreshing) return;
  isRefreshing = true;

  try {
    const liveModels = await fetchLiveAvailableModels();
    
    // Construct filtered capability chains
    const newChains: Record<AICapability, string[]> = {
      textGeneration: [],
      liveVoice: [],
      tts: [],
      transcription: [],
      vision: [],
    };

    const capabilities: AICapability[] = ['textGeneration', 'liveVoice', 'tts', 'transcription', 'vision'];

    for (const cap of capabilities) {
      const preferred = MODEL_PREFERENCES[cap];
      const chainSet = new Set<string>();

      // 1. Preferred models in priority order
      preferred.forEach((m) => chainSet.add(normalizeModelId(m)));

      // 2. Discover any additional models from liveModels that can serve this capability
      if (liveModels.length > 0) {
        if (cap === 'textGeneration') {
          liveModels
            .filter((m) => m.includes('gemini') && !m.includes('embedding') && !m.includes('tts') && !m.includes('transcribe') && !m.includes('imagen'))
            .forEach((m) => chainSet.add(m));
        } else if (cap === 'liveVoice') {
          liveModels
            .filter((m) => m.includes('live') || m.includes('audio-preview'))
            .forEach((m) => chainSet.add(m));
        } else if (cap === 'tts') {
          liveModels
            .filter((m) => m.includes('tts'))
            .forEach((m) => chainSet.add(m));
        } else if (cap === 'transcription') {
          liveModels
            .filter((m) => m.includes('transcribe') || m.includes('audio-preview'))
            .forEach((m) => chainSet.add(m));
        } else if (cap === 'vision') {
          liveModels
            .filter((m) => m.includes('gemini') && !m.includes('embedding') && !m.includes('tts') && !m.includes('transcribe'))
            .forEach((m) => chainSet.add(m));
        }
      }

      newChains[cap] = Array.from(chainSet);
    }

    saveRegistryCache(liveModels, newChains);
    console.log('[ModelRegistry] Refreshed capability chains:', newChains);
  } finally {
    isRefreshing = false;
  }
}

/**
 * Invalidates the current cache, forcing the next lookup or background task to re-query models.list.
 */
export function invalidateModelRegistryCache(): void {
  inMemoryRegistry = null;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(REGISTRY_CACHE_KEY);
      localStorage.removeItem(REGISTRY_CACHE_KEY);
    } catch {
      // Ignore
    }
  }
  // Trigger non-blocking refresh
  refreshModelRegistry().catch(() => {});
}

/**
 * Layer 1 Core Interface: Returns the ordered model chain for a given capability.
 * Synchronous and instant (uses in-memory or persisted cache, fallback to MODEL_PREFERENCES).
 */
export function getModelChain(capability: AICapability): string[] {
  // 1. Check in-memory cache
  if (inMemoryRegistry?.chains[capability]?.length) {
    return [...inMemoryRegistry.chains[capability]];
  }

  // 2. Check storage cache
  const persisted = loadPersistedCache();
  if (persisted?.chains[capability]?.length) {
    inMemoryRegistry = persisted;
    return [...persisted.chains[capability]];
  }

  // 3. Fall back to statically verified preference list
  const fallback = MODEL_PREFERENCES[capability] || [];

  // Initiate background refresh if needed
  if (!isRefreshing && typeof window !== 'undefined') {
    refreshModelRegistry().catch(() => {});
  }

  return [...fallback];
}

// Initial bootstrap on import
if (typeof window !== 'undefined') {
  const persisted = loadPersistedCache();
  if (persisted) {
    inMemoryRegistry = persisted;
  } else {
    // Schedule background initial discovery
    setTimeout(() => {
      refreshModelRegistry().catch(() => {});
    }, 1000);
  }
}
