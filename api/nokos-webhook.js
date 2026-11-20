import {json,method,supabaseAdmin,nokos,bodyRaw,hmac,safeEqualHex} from '../lib/server.js';
import {normalizeOrderStatus,normalizeOtpCode,orderHasReceipt,providerSnapshotAllowsRefund} from '../lib/order-policy.js';
export const config={api:{bodyParser:false}};

const SUPPORTED_EVENTS=new Set(['order.status_changed','order.otp_received']);
function header(req,name){return String(req.headers[name.toLowerCase()]||'');}
function signatureParts(value){
 const m=/^t=(\d{10}),v1=([a-f0-9]{64})$/i.exec(String(value||''));
 return m?{timestamp:Number(m[1]),signature:m[2]}:null;
}
function unwrap(payload){return payload?.order||payload?.data?.order||payload?.data||payload||{};}

export default async function handler(req,res){
 if(!method(req,res,['POST']))return;
 try{
  if(!header(req,'content-type').toLowerCase().includes('application/json'))return json(res,415,{error:'Unsupported content type'});
  const raw=await bodyRaw(req,131072);
  const secret=process.env.NOKOS_WEBHOOK_SECRET;
  const parts=signatureParts(header(req,'x-nokos-signature'));
  if(!secret||!parts)return json(res,401,{error:'Invalid webhook signature'});
  const now=Math.floor(Date.now()/1000);
  if(Math.abs(now-parts.timestamp)>300)return json(res,401,{error:'Webhook timestamp expired'});
  if(!safeEqualHex(parts.signature,hmac(`${parts.timestamp}.${raw}`,secret)))return json(res,401,{error:'Invalid webhook signature'});
  const event=JSON.parse(raw);
  const eventId=String(event?.id||header(req,'x-nokos-event-id')||'');
  const eventType=String(event?.type||header(req,'x-nokos-event-type')||'');
  if(!/^[A-Za-z0-9._:-]{1,160}$/.test(eventId)||eventType.length>80)return json(res,400,{error:'Invalid event metadata'});
  if(header(req,'x-nokos-event-id')&&header(req,'x-nokos-event-id')!==eventId)return json(res,400,{error:'Event ID mismatch'});
  if(header(req,'x-nokos-event-type')&&header(req,'x-nokos-event-type')!==eventType)return json(res,400,{error:'Event type mismatch'});
  if(!SUPPORTED_EVENTS.has(eventType))return json(res,200,{received:true,ignored:true});
  const providerOrderId=String(event?.data?.id||'');
  if(!providerOrderId||providerOrderId.length>160)return json(res,400,{error:'Provider order ID missing'});

  const {data:row,error:rowError}=await supabaseAdmin.from('orders')
   .select('custom_order_id,status,phone,otp,has_receipt,can_cancel,provider_updated_at')
   .eq('provider_order_id',providerOrderId).maybeSingle();
  if(rowError)throw rowError;
  // The order insert/finalize transaction may still be completing when the webhook arrives.
  // Return 503 so NokosPusat retries instead of acknowledging an event we could not match.
  if(!row)return json(res,503,{error:'Order record is not ready; retry webhook'});

  const {error:insertError}=await supabaseAdmin.from('nokos_webhook_events').insert({event_id:eventId,event_type:eventType,provider_order_id:providerOrderId});
  if(insertError&&insertError.code==='23505'){
   const {data:known,error:knownError}=await supabaseAdmin.from('nokos_webhook_events').select('processed_at').eq('event_id',eventId).maybeSingle();
   if(knownError)throw knownError;
   if(known?.processed_at)return json(res,200,{received:true,duplicate:true});
  }else if(insertError)throw insertError;

  // Events can arrive out of order and older queued events may omit receipt fields.
  // Always refresh the provider's current order before persisting status or refunding.
  let snapshot;
  try{snapshot=unwrap(await nokos(`/api/v1/orders/${encodeURIComponent(providerOrderId)}`));}
  catch(providerError){
   if(providerError.retryAfterSeconds)res.setHeader('Retry-After',String(providerError.retryAfterSeconds));
   if(providerError.upstreamStatus===503||providerError.upstreamStatus===429||providerError.upstreamStatus===404){
    return json(res,503,{error:'Current provider status is not ready; retry webhook'});
   }
   throw providerError;
  }
  const stampValue=snapshot.updated_at||event.created_at||null;
  const providerUpdatedAt=stampValue&&Number.isFinite(Date.parse(stampValue))?new Date(stampValue).toISOString():null;
  const oldStamp=row.provider_updated_at?Date.parse(row.provider_updated_at):0;
  const newStamp=providerUpdatedAt?Date.parse(providerUpdatedAt):0;
  if(oldStamp&&newStamp&&newStamp<oldStamp){
   await supabaseAdmin.from('nokos_webhook_events').update({processed_at:new Date().toISOString()}).eq('event_id',eventId);
   return json(res,200,{received:true,stale:true});
  }

  // Preserve receipt evidence already seen, even when a later payload omits the OTP body.
  const incomingOtp=normalizeOtpCode(snapshot.otp);
  const hasReceipt=row.has_receipt===true||orderHasReceipt(snapshot);
  const status=normalizeOrderStatus(snapshot.status);
  const update={status,phone:snapshot.number||snapshot.phone||row.phone||null,otp:incomingOtp||row.otp||null,
   has_receipt:hasReceipt,can_cancel:typeof snapshot.can_cancel==='boolean'?snapshot.can_cancel:row.can_cancel===true,
   expires_at:snapshot.expires_at||undefined,refund_eligible_at:snapshot.refund_eligible_at||undefined,
   next_check_after_seconds:Number(snapshot.next_check_after_seconds)||5,provider_updated_at:providerUpdatedAt||undefined};
  const {error:updateError}=await supabaseAdmin.from('orders').update(update).eq('custom_order_id',row.custom_order_id);
  if(updateError)throw updateError;
  if(providerSnapshotAllowsRefund(snapshot)&&!hasReceipt&&!row.otp){
   const {error:refundError}=await supabaseAdmin.rpc('refund_order_balance',{p_custom_order_id:row.custom_order_id});
   if(refundError)throw refundError;
  }
  const {error:processedError}=await supabaseAdmin.from('nokos_webhook_events').update({processed_at:new Date().toISOString()}).eq('event_id',eventId);
  if(processedError)throw processedError;
  return json(res,200,{received:true});
 }catch(error){
  if(error.message==='Payload too large')return json(res,413,{error:'Payload too large'});
  if(error instanceof SyntaxError)return json(res,400,{error:'Invalid JSON'});
  return json(res,500,{error:'Webhook processing failed'});
 }
}
