import {json,method,auth,supabaseAdmin,nokos,enforceRateLimit} from '../lib/server.js';
import {normalizeOrderStatus,normalizeOtpCode,orderHasReceipt,providerSnapshotAllowsRefund} from '../lib/order-policy.js';

function snapshot(payload){return payload?.order||payload?.data?.order||payload?.data||payload||{};}
function responseShape(row){return {custom_order_id:row.custom_order_id,status:row.status,phone:row.phone,otp:row.otp,has_receipt:row.has_receipt===true,can_cancel:row.can_cancel===true,expires_at:row.expires_at,refund_eligible_at:row.refund_eligible_at,next_check_after_seconds:row.next_check_after_seconds||5,cancel_requested_at:row.cancel_requested_at,refunded_at:row.refunded_at,refunded:Boolean(row.refunded_at)};}

export default async function handler(req,res){
 if(!method(req,res,['GET']))return;
 try{
  const user=await auth(req);
  await enforceRateLimit(user.id,'order-status',20,60);
  const id=new URL(req.url,'http://localhost').searchParams.get('id');
  if(!id||id.length>80)return json(res,400,{error:'ID pesanan tidak valid.'});
  const {data:row,error}=await supabaseAdmin.from('orders')
   .select('custom_order_id,provider_order_id,status,phone,otp,has_receipt,can_cancel,expires_at,refund_eligible_at,next_check_after_seconds,cancel_requested_at,provider_updated_at,refunded_at')
   .eq('custom_order_id',id).eq('user_id',user.id).single();
  if(error)throw error;
  if(!row.provider_order_id)return json(res,200,{...responseShape(row),allocation_pending:true});

  let upstream;
  try{upstream=snapshot(await nokos(`/api/v1/orders/${encodeURIComponent(row.provider_order_id)}`));}
  catch(error){
   if(error.upstreamStatus===503||error.upstreamStatus===429){
    return json(res,202,{...responseShape(row),check_pending:true,next_check_after_seconds:error.retryAfterSeconds||5,message:'Pemeriksaan provider sedang berlangsung. Tunggu sebentar.'});
   }
   throw error;
  }
  const upstreamStamp=upstream.updated_at&&Number.isFinite(Date.parse(upstream.updated_at))?new Date(upstream.updated_at).toISOString():null;
  if(row.provider_updated_at&&upstreamStamp&&Date.parse(upstreamStamp)<Date.parse(row.provider_updated_at)){
   return json(res,200,responseShape(row));
  }
  const incomingCode=normalizeOtpCode(upstream.otp);
  const code=incomingCode||row.otp||null;
  const status=normalizeOrderStatus(upstream.status);
  const phone=upstream.number||upstream.phone||row.phone||null;
  const hasReceipt=row.has_receipt===true||orderHasReceipt(upstream)||Boolean(row.otp);
  const update={status,phone,otp:code,has_receipt:hasReceipt,can_cancel:upstream.can_cancel===true,
   expires_at:upstream.expires_at||null,refund_eligible_at:upstream.refund_eligible_at||null,
   next_check_after_seconds:Number(upstream.next_check_after_seconds)||5,provider_updated_at:upstreamStamp||undefined};
  const {error:updateError}=await supabaseAdmin.from('orders').update(update).eq('custom_order_id',id).eq('user_id',user.id);
  if(updateError)throw updateError;
  if(providerSnapshotAllowsRefund(upstream)&&!hasReceipt&&!row.otp){
   const {error:refundError}=await supabaseAdmin.rpc('refund_order_balance',{p_custom_order_id:id});
   if(refundError)throw refundError;
  }
  const {data:latest,error:latestError}=await supabaseAdmin.from('orders')
   .select('custom_order_id,status,phone,otp,has_receipt,can_cancel,expires_at,refund_eligible_at,next_check_after_seconds,cancel_requested_at,provider_updated_at,refunded_at')
   .eq('custom_order_id',id).eq('user_id',user.id).single();
  if(latestError)throw latestError;
  json(res,200,responseShape(latest));
 }catch(e){json(res,e.status||502,{error:(e.status&&e.status<500)?e.message:'Status OTP belum dapat diperbarui. Coba lagi.'});}
}
