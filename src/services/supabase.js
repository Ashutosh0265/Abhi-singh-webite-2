import { createClient } from '@supabase/supabase-js';

function getInitialConfig() {
  const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';
  if (envUrl && envKey && !envUrl.includes('placeholder') && envUrl.startsWith('https://')) {
    return { url: envUrl, anonKey: envKey };
  }
  try {
    const raw = localStorage.getItem('elrx_api_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.supabaseUrl && parsed.supabaseAnonKey && parsed.supabaseUrl.startsWith('https://')) {
        return { url: parsed.supabaseUrl, anonKey: parsed.supabaseAnonKey };
      }
    }
  } catch {
    // ignore
  }
  return { url: '', anonKey: '' };
}

const initialConfig = getInitialConfig();

export let isSupabaseConfigured = Boolean(
  initialConfig.url &&
  initialConfig.anonKey &&
  !initialConfig.url.includes('placeholder') &&
  initialConfig.url.startsWith('https://')
);

export let supabase = isSupabaseConfigured
  ? createClient(initialConfig.url, initialConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabase() {
  return supabase;
}

export function checkIsSupabaseConfigured() {
  return Boolean(isSupabaseConfigured && supabase);
}

/**
 * Re-initialize Supabase client dynamically at runtime
 */
export function initSupabase(url, anonKey) {
  if (url && anonKey && url.startsWith('https://') && anonKey.length > 20) {
    isSupabaseConfigured = true;
    supabase = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return supabase;
  } else {
    isSupabaseConfigured = false;
    supabase = null;
    return null;
  }
}
