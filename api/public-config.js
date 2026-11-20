// Public browser configuration only. This endpoint must not import lib/server.js:
// that module initializes the privileged Supabase admin client and can fail when
// server-only credentials are absent, preventing the public config from loading.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
  const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || '').trim();
  const validUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl);

  if (!validUrl || !supabaseAnonKey) {
    return res.status(503).json({
      error: 'Konfigurasi Supabase belum lengkap. Periksa SUPABASE_URL dan SUPABASE_ANON_KEY di Vercel.'
    });
  }

  return res.status(200).json({ supabaseUrl, supabaseAnonKey });
}
