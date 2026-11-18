import { json, method, auth, supabaseAdmin, nokos, enforceRateLimit } from '../lib/server.js';

const PROVIDERS = Array.from({ length: 5 }, (_, i) => ({ provider_id: `provider_${i + 1}`, label: `Provider ${i + 1}`, enabled: true, markup_idr: 0 }));
const USER_FIELDS = 'id,display_name,username,avatar_url,balance,total_deposit,admin_role,is_verified,is_blocked,blocked_reason,created_at';

async function authorize(req) {
  const user = await auth(req);
  const isOwner = Boolean(process.env.SORAOTP_OWNER_ID && user.id === process.env.SORAOTP_OWNER_ID);
  const { data: profile, error } = await supabaseAdmin.from('profiles').select('admin_role').eq('id', user.id).maybeSingle();
  if (error) throw error;
  const role = isOwner ? 'owner' : (profile?.admin_role || 'user');
  if (!['owner', 'admin', 'moderator'].includes(role)) throw Object.assign(new Error('Akses admin tidak diizinkan.'), { status: 403 });
  await enforceRateLimit(user.id, 'admin-dashboard', 90, 60);
  return { user, role, isOwner, canManage: role === 'owner' || role === 'admin' };
}

async function audit(actorId, action, targetId = null, details = {}) {
  const { error } = await supabaseAdmin.from('admin_audit_log').insert({ actor_id: actorId, action, target_id: targetId ? String(targetId) : null, details });
  if (error) console.warn('Admin audit log insert failed:', error.message);
}

async function loadProfilesByIds(ids) {
  const unique = [...new Set((ids || []).filter(Boolean))];
  if (!unique.length) return new Map();
  const { data, error } = await supabaseAdmin.from('profiles').select('id,username,display_name').in('id', unique);
  if (error) throw error;
  return new Map((data || []).map(row => [row.id, row]));
}

export default async function handler(req, res) {
  if (!method(req, res, ['GET', 'POST'])) return;
  try {
    const actor = await authorize(req);
    if (req.method === 'GET') {
      const action = new URL(req.url, 'http://localhost').searchParams.get('action') || 'overview';
      if (action === 'overview') {
        const [users, orders, topups, recentUsers, paid, pendingOrders, pendingPayments] = await Promise.all([
          supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('topups').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
          supabaseAdmin.rpc('admin_paid_topup_stats'),
          supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pending', 'allocating', 'allocation_uncertain', 'awaiting_otp']),
          supabaseAdmin.from('topups').select('id', { count: 'exact', head: true }).eq('status', 'pending')
        ]);
        for (const result of [users, orders, topups, recentUsers, paid, pendingOrders, pendingPayments]) if (result.error) throw result.error;
        const paidStats = Array.isArray(paid.data) ? paid.data[0] : paid.data;
        const revenue = Number(paidStats?.paid_amount || 0);
        const gateway = { sekaliPay: { configured: Boolean(process.env.SEKALIPAY_API_KEY && process.env.SEKALIPAY_SECRET_KEY), mode: process.env.SEKALIPAY_IS_SANDBOX === 'true' ? 'Sandbox' : 'Production' }, midtrans: { configured: Boolean(process.env.MIDTRANS_SERVER_KEY), status: 'Tidak terhubung ke alur pembayaran saat ini' } };
        return json(res, 200, { role: actor.role, stats: { users: users.count || 0, orders: orders.count || 0, topups: topups.count || 0, newUsers7d: recentUsers.count || 0, revenue, pendingOrders: pendingOrders.count || 0, pendingPayments: pendingPayments.count || 0 }, gateway });
      }
      if (action === 'users') {
        const { data, error } = await supabaseAdmin.from('profiles').select(USER_FIELDS).order('created_at', { ascending: false }).limit(250);
        if (error) throw error;
        return json(res, 200, { users: data || [], role: actor.role });
      }
      if (action === 'orders') {
        const { data, error } = await supabaseAdmin.from('orders').select('id,user_id,custom_order_id,service_name,provider,country_code,amount,status,created_at').order('created_at', { ascending: false }).limit(150);
        if (error) throw error;
        const profiles = await loadProfilesByIds((data || []).map(row => row.user_id));
        return json(res, 200, { orders: (data || []).map(row => ({ ...row, username: profiles.get(row.user_id)?.username || 'user' })) });
      }
      if (action === 'balances' || action === 'gateway') {
        const { data, error } = await supabaseAdmin.from('topups').select('id,user_id,merchant_ref_id,invoice,amount,status,is_sandbox,created_at,paid_at').order('created_at', { ascending: false }).limit(150);
        if (error) throw error;
        const profiles = await loadProfilesByIds((data || []).map(row => row.user_id));
        const rows = (data || []).map(row => ({ ...row, username: profiles.get(row.user_id)?.username || 'user' }));
        if (action === 'gateway') return json(res, 200, { topups: rows, sekaliPay: { configured: Boolean(process.env.SEKALIPAY_API_KEY && process.env.SEKALIPAY_SECRET_KEY), mode: process.env.SEKALIPAY_IS_SANDBOX === 'true' ? 'Sandbox' : 'Production' }, midtrans: { configured: Boolean(process.env.MIDTRANS_SERVER_KEY), status: 'Belum terintegrasi dalam flow transaksi saat ini' } });
        const { data: adjustments, error: adjustmentError } = await supabaseAdmin.from('admin_balance_adjustments').select('id,user_id,actor_id,amount,reason,balance_after,created_at').order('created_at', { ascending: false }).limit(100);
        if (adjustmentError) throw adjustmentError;
        return json(res, 200, { topups: rows, adjustments: adjustments || [] });
      }
      if (action === 'providers') {
        const [{ data: saved, error }, catalogResult] = await Promise.all([
          supabaseAdmin.from('admin_provider_settings').select('provider_id,label,enabled,markup_idr,updated_at'),
          nokos('/api/v1/services').then(data => ({ data, warning: null })).catch(error => ({ data: [], warning: error.message }))
        ]);
        if (error) throw error;
        const configs = new Map((saved || []).map(row => [row.provider_id, row]));
        const providers = PROVIDERS.map(item => ({ ...item, ...(configs.get(item.provider_id) || {}) }));
        let services = Array.isArray(catalogResult.data) ? catalogResult.data : (catalogResult.data?.data || catalogResult.data?.services || []);
        const { data: flags, error: flagError } = await supabaseAdmin.from('admin_service_settings').select('service_id,service_name,enabled');
        if (flagError) throw flagError;
        const serviceFlags = new Map((flags || []).map(row => [row.service_id, row]));
        services = services.map(row => ({ id: String(row.id ?? row.service_id ?? ''), name: String(row.name ?? row.service_name ?? row.title ?? row.id ?? ''), ...(serviceFlags.get(String(row.id ?? row.service_id ?? '')) || {}) }));
        return json(res, 200, { providers, services, warning: catalogResult.warning });
      }
      if (action === 'chat') {
        const { data, error } = await supabaseAdmin.from('public_chat_messages').select('id,user_id,username,admin_role,is_verified,created_at,body').order('created_at', { ascending: false }).limit(120);
        if (error) throw error;
        return json(res, 200, { messages: (data || []).map(row => ({ id: row.id, user_id: row.user_id, username: row.username, admin_role: row.admin_role, is_verified: row.is_verified, created_at: row.created_at, encrypted: String(row.body || '').startsWith('E2EE1.'), payload_size: String(row.body || '').length })) });
      }
      if (action === 'settings') {
        const { data, error } = await supabaseAdmin.from('admin_website_settings').select('settings,updated_at').eq('id', true).maybeSingle();
        if (error) throw error;
        return json(res, 200, { settings: data?.settings || { announcement: '', maintenance_mode: false, chat_enabled: true }, updated_at: data?.updated_at || null });
      }
      return json(res, 400, { error: 'Admin action tidak dikenal.' });
    }

    const body = req.body || {};
    const action = String(body.action || '');
    if (action === 'block_user') {
      const targetId = String(body.user_id || '');
      const blocked = body.blocked === true;
      if (!targetId || targetId === actor.user.id || targetId === process.env.SORAOTP_OWNER_ID) return json(res, 400, { error: 'Target pengguna tidak valid.' });
      const { data: target, error: targetError } = await supabaseAdmin.from('profiles').select('id,admin_role').eq('id', targetId).maybeSingle();
      if (targetError) throw targetError;
      if (!target) return json(res, 404, { error: 'Pengguna tidak ditemukan.' });
      if (target.admin_role === 'admin' && !actor.isOwner) return json(res, 403, { error: 'Hanya pemilik utama yang dapat memblokir admin.' });
      if (actor.role === 'moderator' && target.admin_role !== 'user') return json(res, 403, { error: 'Moderator hanya dapat memoderasi pengguna biasa.' });
      const reason = String(body.reason || '').slice(0, 240);
      const { error } = await supabaseAdmin.from('profiles').update({ is_blocked: blocked, blocked_reason: blocked ? (reason || 'Dibatasi oleh moderator') : null, blocked_at: blocked ? new Date().toISOString() : null }).eq('id', targetId);
      if (error) throw error;
      await audit(actor.user.id, blocked ? 'user.block' : 'user.unblock', targetId, { reason });
      return json(res, 200, { success: true });
    }
    if (action === 'update_user_badge') {
      if (!actor.canManage) return json(res, 403, { error: 'Hanya admin yang dapat mengubah tanda akun.' });
      const targetId = String(body.user_id || '');
      const role = String(body.admin_role || 'user');
      const isVerified = body.is_verified === true;
      if (!targetId || !['user', 'moderator', 'admin'].includes(role)) return json(res, 400, { error: 'Data tanda akun tidak valid.' });
      if (role === 'admin' && !actor.isOwner) return json(res, 403, { error: 'Hanya pemilik utama yang dapat memberikan akses Admin.' });
      if (targetId === process.env.SORAOTP_OWNER_ID) return json(res, 403, { error: 'Akun pemilik utama tidak dapat diubah.' });
      const { data: target, error: targetError } = await supabaseAdmin.from('profiles').select('admin_role').eq('id', targetId).maybeSingle();
      if (targetError) throw targetError;
      if (!target) return json(res, 404, { error: 'Pengguna tidak ditemukan.' });
      if (target.admin_role === 'admin' && !actor.isOwner) return json(res, 403, { error: 'Hanya pemilik utama yang dapat mengubah admin.' });
      const { error } = await supabaseAdmin.from('profiles').update({ admin_role: role, is_verified: isVerified }).eq('id', targetId);
      if (error) throw error;
      const { error: chatBadgeError } = await supabaseAdmin.from('public_chat_messages').update({ admin_role: role, is_verified: isVerified }).eq('user_id', targetId);
      if (chatBadgeError) throw chatBadgeError;
      await audit(actor.user.id, 'user.badge.update', targetId, { admin_role: role, is_verified: isVerified });
      return json(res, 200, { success: true });
    }
    if (action === 'adjust_balance') {
      if (!actor.canManage) return json(res, 403, { error: 'Hanya admin yang dapat menyesuaikan saldo.' });
      const userId = String(body.user_id || '');
      const amount = Number(body.amount);
      const reason = String(body.reason || '').trim();
      if (!userId || !Number.isSafeInteger(amount) || amount === 0 || Math.abs(amount) > 1000000000 || reason.length < 3 || reason.length > 240) return json(res, 400, { error: 'Nominal dan alasan penyesuaian saldo tidak valid.' });
      const { data, error } = await supabaseAdmin.rpc('admin_adjust_balance', { p_user_id: userId, p_actor_id: actor.user.id, p_amount: amount, p_reason: reason });
      if (error) throw error;
      await audit(actor.user.id, 'balance.adjust', userId, { amount, reason });
      return json(res, 200, { success: true, adjustment: data });
    }
    if (action === 'delete_chat_message') {
      const messageId = String(body.message_id || '');
      if (!messageId) return json(res, 400, { error: 'ID pesan tidak valid.' });
      const { error } = await supabaseAdmin.from('public_chat_messages').delete().eq('id', messageId);
      if (error) throw error;
      await audit(actor.user.id, 'chat.message.delete', messageId, {});
      return json(res, 200, { success: true });
    }
    if (action === 'update_provider') {
      if (!actor.canManage) return json(res, 403, { error: 'Hanya admin yang dapat mengubah provider.' });
      const providerId = String(body.provider_id || '');
      const label = String(body.label || '').trim().slice(0, 60);
      const markup = Number(body.markup_idr);
      if (!/^provider_[1-5]$/.test(providerId) || !label || !Number.isSafeInteger(markup) || markup < 0 || markup > 1000000) return json(res, 400, { error: 'Pengaturan provider tidak valid.' });
      const { error } = await supabaseAdmin.from('admin_provider_settings').upsert({ provider_id: providerId, label, enabled: body.enabled !== false, markup_idr: markup, updated_at: new Date().toISOString() }, { onConflict: 'provider_id' });
      if (error) throw error;
      await audit(actor.user.id, 'provider.update', providerId, { label, enabled: body.enabled !== false, markup_idr: markup });
      return json(res, 200, { success: true });
    }
    if (action === 'update_service') {
      if (!actor.canManage) return json(res, 403, { error: 'Hanya admin yang dapat mengubah layanan.' });
      const serviceId = String(body.service_id || '').slice(0, 100);
      const serviceName = String(body.service_name || '').slice(0, 120);
      if (!serviceId || !serviceName) return json(res, 400, { error: 'Data layanan tidak valid.' });
      const { error } = await supabaseAdmin.from('admin_service_settings').upsert({ service_id: serviceId, service_name: serviceName, enabled: body.enabled !== false, updated_at: new Date().toISOString() }, { onConflict: 'service_id' });
      if (error) throw error;
      await audit(actor.user.id, 'service.update', serviceId, { service_name: serviceName, enabled: body.enabled !== false });
      return json(res, 200, { success: true });
    }
    if (action === 'update_website_settings') {
      if (!actor.canManage) return json(res, 403, { error: 'Hanya admin yang dapat mengubah pengaturan website.' });
      const settings = { announcement: String(body.settings?.announcement || '').trim().slice(0, 220), maintenance_mode: body.settings?.maintenance_mode === true, chat_enabled: body.settings?.chat_enabled !== false };
      const { error } = await supabaseAdmin.from('admin_website_settings').upsert({ id: true, settings, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (error) throw error;
      await audit(actor.user.id, 'website.settings.update', 'global', { settings });
      return json(res, 200, { success: true });
    }
    return json(res, 400, { error: 'Admin action tidak dikenal.' });
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) console.error('Admin API error:', error.message);
    return json(res, status, { error: status >= 500 ? 'Permintaan admin gagal diproses. Pastikan migrasi admin sudah dijalankan.' : error.message });
  }
}
