export async function createSupabaseClientFromConfig() {
  const response = await fetch('/api/public-config', { cache: 'no-store' });
  const rawText = await response.text();
  let cfg = {};
  try {
    cfg = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(`Respons konfigurasi Supabase tidak valid (${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(cfg.error || `Konfigurasi Supabase gagal dimuat (${response.status}). Periksa Environment Variables server.`);
  }
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
    throw new Error('Konfigurasi Supabase tidak lengkap atau library Supabase belum termuat.');
  }
  return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: window.localStorage
    }
  });
}

export function hasAuthCallbackParams() {
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash || '';
  return search.has('code') || search.has('token_hash') || hash.includes('access_token=') || hash.includes('refresh_token=');
}

export function redirectToApp(extraSearch = '') {
  const target = `/app.html${extraSearch || window.location.search || ''}`;
  window.location.replace(target);
}
