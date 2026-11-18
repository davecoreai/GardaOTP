import {json,method,auth,supabaseAdmin,nokos,enforceRateLimit} from '../lib/server.js';
import {normalizeOrderStatus,normalizeOtpCode,orderHasReceipt,providerSnapshotAllowsRefund} from '../lib/order-policy.js';

function snapshot(payload){return payload?.order||payload?.data?.order||payload?.data||payload||{};}
async function saveSnapshot(id,userId,order){
 const {data:current,error:currentError}=await supabaseAdmin.from('orders').select('otp,has_receipt,provider_updated_at').eq('custom_order_id',id).eq('user_id',userId).single();
 if(currentError)throw currentError;
 const incomingStamp=order.updated_at&&Number.isFinite(Date.parse(order.updated_at))?new Date(order.updated_at).toISOString():null;
 const stale=current.provider_updated_at&&incomingStamp&&Date.parse(incomingStamp)<Date.parse(current.provider_updated_at);
 if(!stale){
  const incomingCode=normalizeOtpCode(order.otp),code=incomingCode||current.otp||null;
  const hasReceipt=current.has_receipt===true||orderHasReceipt(order)||Boolean(current.otp);
  const {error}=await supabaseAdmin.from('orders').update({status:normalizeOrderStatus(order.status),phone:order.number||order.phone||null,otp:code,has_receipt:hasReceipt,can_cancel:order.can_cancel===true,expires_at:order.expires_at||null,refund_eligible_at:order.refund_eligible_at||null,next_check_after_seconds:Number(order.next_check_after_seconds)||5,provider_updated_at:incomingStamp||undefined}).eq('custom_order_id',id).eq('user_id',userId);
  if(error)throw error;
  if(providerSnapshotAllowsRefund(order)&&!hasReceipt&&!current.otp){const {error:refundError}=await supabaseAdmin.rpc('refund_order_balance',{p_custom_order_id:id});if(refundError)throw refundError;}
 }
 const {data:latest,error:readError}=await supabaseAdmin.from('orders').select('custom_order_id,status,phone,otp,has_receipt,can_cancel,expires_at,refund_eligible_at,next_check_after_seconds,cancel_requested_at,provider_updated_at,refunded_at').eq('custom_order_id',id).eq('user_id',userId).single();
 if(readError)throw readError;
 return latest;
}
function publicRow(row){return {custom_order_id:row.custom_order_id,status:row.status,phone:row.phone,otp:row.otp,has_receipt:row.has_receipt===true,can_cancel:row.can_cancel===true,expires_at:row.expires_at,refund_eligible_at:row.refund_eligible_at,next_check_after_seconds:row.next_check_after_seconds||5,cancel_requested_at:row.cancel_requested_at,refunded_at:row.refunded_at,refunded:Boolean(row.refunded_at)};}

export default async function handler(req,res){
 if(!method(req,res,['POST']))return;
 try{
  const user=await auth(req);
  await enforceRateLimit(user.id,'cancel-order',4,60);
  const id=String(req.body?.id||'');
  if(!id||id.length>80)return json(res,400,{error:'ID pesanan tidak valid.'});
  const {data:row,error}=await supabaseAdmin.from('orders')
   .select('custom_order_id,provider_order_id,status,phone,otp,has_receipt,can_cancel,expires_at,refund_eligible_at,next_check_after_seconds,cancel_requested_at,provider_updated_at,refunded_at')
   .eq('custom_order_id',id).eq('user_id',user.id).single();
  if(error)throw error;
  if(row.refunded_at)return json(res,200,{...publicRow(row),message:'Saldo sudah dikembalikan 100%.'});
  if(!row.provider_order_id)return json(res,409,{error:'Nomor belum selesai dialokasikan. Tunggu status pesanan terlebih dahulu.'});
  if(row.otp||row.has_receipt||['completed','success'].includes(row.status))return json(res,409,{error:'OTP atau bukti pesan sudah diterima. Pesanan ini tidak memenuhi garansi refund.'});

  // Read fresh provider state before requesting a cancellation.
  let latest;
  try{latest=snapshot(await nokos(`/api/v1/orders/${encodeURIComponent(row.provider_order_id)}`));}
  catch(e){if(e.upstreamStatus===503||e.upstreamStatus===429)return json(res,202,{status:row.status,check_pending:true,next_check_after_seconds:e.retryAfterSeconds||5,message:'Status provider sedang diperiksa. Belum ada pembatalan atau refund yang dikonfirmasi.'});throw e;}
  const code=normalizeOtpCode(latest.otp),providerStatus=normalizeOrderStatus(latest.status);
  const hasReceipt=orderHasReceipt(latest);
  if(code||hasReceipt||['completed','success'].includes(providerStatus)){
   const saved=await saveSnapshot(id,user.id,latest);
   return json(res,409,{...publicRow(saved),error:'OTP atau bukti pesan sudah diterima. Garansi refund tidak berlaku.'});
  }
  if(['cancelled','canceled','expired'].includes(providerStatus)){
   const saved=await saveSnapshot(id,user.id,latest);
   return json(res,200,{...publicRow(saved),message:saved.refunded_at?'Pembatalan terkonfirmasi. Saldo kembali 100%.':'Pembatalan terdeteksi; refund sedang diselesaikan.'});
  }

  // DELETE is sent at most once. NokosPusat may return a still-active snapshot while
  // it verifies release with the upstream provider; never repeat DELETE automatically.
  if(row.cancel_requested_at){
   const saved=await saveSnapshot(id,user.id,latest);
   return json(res,202,{...publicRow(saved),message:'Pembatalan sudah diminta dan sedang diverifikasi provider. Periksa status pesanan lagi sebentar.'});
  }
  if(latest.can_cancel!==true){
   const saved=await saveSnapshot(id,user.id,latest);
   return json(res,409,{...publicRow(saved),error:'Pesanan belum memenuhi syarat pembatalan provider. Garansi refund akan tersedia bila NokosPusat mengizinkan pembatalan.'});
  }
  const cancelRequestedAt=new Date().toISOString();
  const {data:marked,error:markError}=await supabaseAdmin.from('orders').update({cancel_requested_at:cancelRequestedAt})
   .eq('custom_order_id',id).eq('user_id',user.id).is('cancel_requested_at',null).select('custom_order_id').maybeSingle();
  if(markError)throw markError;
  if(!marked)return json(res,202,{status:row.status,message:'Permintaan pembatalan lain sedang diproses. Periksa status pesanan.'});

  let cancelled;
  try{cancelled=snapshot(await nokos(`/api/v1/orders/${encodeURIComponent(row.provider_order_id)}`,{method:'DELETE'}));}
  catch(e){
   // A definite cooldown/eligibility response means DELETE was rejected, not accepted.
   // Clear the marker so a later user-initiated attempt can be made after Retry-After.
   if(e.upstreamStatus===409||e.upstreamStatus===429){
    const {error:resetError}=await supabaseAdmin.from('orders').update({cancel_requested_at:null,can_cancel:false})
     .eq('custom_order_id',id).eq('user_id',user.id).eq('cancel_requested_at',cancelRequestedAt);
    if(resetError)throw resetError;
    return json(res,e.status||409,{status:row.status,can_cancel:false,next_check_after_seconds:e.retryAfterSeconds||120,message:'Provider belum menerima pembatalan karena syarat waktu atau cooldown. Status akan diperiksa lagi sebelum pembatalan berikutnya.'});
   }
   return json(res,202,{status:row.status,cancel_requested_at:cancelRequestedAt,check_pending:true,next_check_after_seconds:e.retryAfterSeconds||8,message:'Permintaan pembatalan sudah dikirim, tetapi konfirmasi provider belum diterima. Saldo belum dikembalikan; periksa status pesanan lagi.'});
  }
  const saved=await saveSnapshot(id,user.id,cancelled);
  if(saved.refunded_at)return json(res,200,{...publicRow(saved),message:'Pembatalan terkonfirmasi. Saldo kembali 100%.'});
  if(['completed','success'].includes(saved.status)||saved.otp||saved.has_receipt)return json(res,409,{...publicRow(saved),error:'Provider mendeteksi OTP atau bukti pesan. Refund tidak dapat diberikan.'});
  return json(res,202,{...publicRow(saved),message:'Permintaan pembatalan sedang diverifikasi NokosPusat. Saldo akan kembali 100% setelah status cancelled/expired dikonfirmasi tanpa OTP.'});
 }catch(e){json(res,e.status||502,{error:(e.status&&e.status<500)?e.message:'Pembatalan belum dapat dipastikan. Periksa status pesanan sebelum mencoba tindakan lain.'});}
}
