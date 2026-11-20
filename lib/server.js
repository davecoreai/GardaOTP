import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

function createSupabaseAdmin() {
  const url = String(process.env.SUPABASE_URL || '').trim();
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (url && key) {
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  console.warn('[AI Studio] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured — Supabase admin stub active.');
  const notConfigured = () => Object.assign(
    new Error('Konfigurasi Supabase belum lengkap. Periksa SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.'),
    { status: 503 }
  );
  const createStubChain = () => {
    const chain = {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      delete: () => chain,
      upsert: () => chain,
      eq: () => chain,
      neq: () => chain,
      is: () => chain,
      in: () => chain,
      order: () => chain,
      limit: () => chain,
      single: async () => ({ data: null, error: notConfigured() }),
      maybeSingle: async () => ({ data: null, error: notConfigured() }),
      then: (resolve) => Promise.resolve({ data: null, error: notConfigured() }).then(resolve)
    };
    return chain;
  };
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: notConfigured() })
    },
    from: () => createStubChain(),
    rpc: async () => ({ data: null, error: notConfigured() })
  };
}
export const supabaseAdmin = createSupabaseAdmin();
export function json(res, status, data) { res.status(status).setHeader('Content-Type','application/json; charset=utf-8').setHeader('Cache-Control','no-store').setHeader('X-Content-Type-Options','nosniff').setHeader('Referrer-Policy','no-referrer').json(data); }
export function method(req, res, allowed) { if (!allowed.includes(req.method)) { res.setHeader('Allow',allowed.join(', ')); json(res,405,{error:'Method not allowed'}); return false; } return true; }
export async function auth(req) {
  const authorization = String(req.headers.authorization || '');
  const match = /^Bearer ([A-Za-z0-9._~-]{20,8192})$/.exec(authorization);
  const token = match?.[1];
  if (!token) throw Object.assign(new Error('Silakan login terlebih dahulu.'),{status:401});
  const {data,error} = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw Object.assign(new Error('Sesi login tidak valid.'),{status:401});
  return data.user;
}
export async function nokos(path, options={}) {
  if (!process.env.NOKOS_API_KEY) throw Object.assign(new Error('NOKOS_API_KEY belum diatur di server.'),{status:503});
  const base = new URL(String(process.env.NOKOS_BASE_URL || '').trim() || 'https://nokospusat.com');
  if (base.protocol !== 'https:' || base.hostname !== 'nokospusat.com' || base.username || base.password) throw Object.assign(new Error('Konfigurasi provider tidak valid.'),{status:503});
  const response = await fetch(`${base.origin}${path}`, { ...options, signal: options.signal || AbortSignal.timeout(12000), headers: { Authorization:`Bearer ${process.env.NOKOS_API_KEY}`, Accept:'application/json', ...(options.body?{'Content-Type':'application/json'}:{}), ...options.headers } });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw Object.assign(new Error('Garda OTP gagal memuat penawaran.'),{status:response.status >= 500 ? 502 : response.status,upstreamStatus:response.status,retryAfterSeconds:Number(response.headers.get('Retry-After')||0)||null});
  return data?.data ?? data;
}
export function customOrderId(){ return `SORA-${randomBytes(12).toString('hex').toUpperCase()}`; }

export async function enforceRateLimit(subject, bucket, limit, windowSeconds = 60) {
  const { data, error } = await supabaseAdmin.rpc('consume_api_rate_limit', {
    p_bucket: bucket,
    p_subject: String(subject),
    p_limit: limit,
    p_window_seconds: windowSeconds
  });
  if (error) throw Object.assign(new Error('Layanan sedang sibuk. Coba lagi sebentar.'), { status: 503 });
  if (data !== true) throw Object.assign(new Error('Terlalu banyak permintaan. Coba lagi sebentar.'), { status: 429 });
}

export function hmac(value, secret){ return createHmac('sha256',secret).update(value).digest('hex'); }
export function safeEqualHex(a,b){ try { const x=Buffer.from(String(a||''),'hex'), y=Buffer.from(String(b||''),'hex'); return x.length===y.length && timingSafeEqual(x,y); } catch { return false; } }
export async function bodyRaw(req, maxBytes = 65536){
  if (Buffer.isBuffer(req.body)) { if (req.body.length > maxBytes) throw new Error('Payload too large'); return req.body.toString('utf8'); }
  if (typeof req.body === 'string') { if (Buffer.byteLength(req.body) > maxBytes) throw new Error('Payload too large'); return req.body; }
  if (req.body && typeof req.body === 'object') throw new Error('Raw request body required');
  const chunks=[]; let size=0;
  for await (const chunk of req) { const part=Buffer.from(chunk); size += part.length; if (size > maxBytes) throw new Error('Payload too large'); chunks.push(part); }
  return Buffer.concat(chunks).toString('utf8');
}
export function rupiah(n){ return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0)); }
