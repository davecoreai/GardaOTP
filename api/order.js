import {json,method,auth,supabaseAdmin,nokos,customOrderId,enforceRateLimit} from '../lib/server.js';
export default async function handler(req,res){
 if(!method(req,res,['POST']))return;
 try{
  const user=await auth(req); await enforceRateLimit(user.id,'create-order',5,60); const body=req.body||{}; const serviceId=String(body.service_id??''); const serviceName=String(body.service_name??''); const provider=String(body.provider??''); const countryCode=String(body.country_code??''); const providerId=String(body.provider_id??''); const submittedPrice=Number(body.quoted_price);
  if(!serviceId||serviceId.length>80||!serviceName||serviceName.length>120||!/^provider_[1-2]$/.test(provider)||!countryCode||countryCode.length>16||!providerId||providerId.length>120||!Number.isSafeInteger(submittedPrice)||submittedPrice<1)return json(res,400,{error:'Pilihan nomor tidak lengkap atau harga tidak valid.'});
  // Never debit a client-supplied quote. Re-fetch the selected offer from NokosPusat.
  const disabledProviders=String(process.env.NOKOS_DISABLED_PROVIDERS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(disabledProviders.includes(provider))return json(res,403,{error:'Provider sedang tidak tersedia.'});
  const offersResponse=await nokos(`/api/v1/services/${encodeURIComponent(serviceId)}/offers?provider=${encodeURIComponent(provider)}&country_code=${encodeURIComponent(countryCode)}`);
  const currentOffers=Array.isArray(offersResponse)?offersResponse:(offersResponse?.data||offersResponse?.offers||[]);
  const verifiedOffer=Array.isArray(currentOffers)?currentOffers.find(item=>String(item.provider_id)===providerId):null;
  const supplierPrice=Number(verifiedOffer?.price);
  const markup=Math.max(0,Math.trunc(Number(process.env.PRICE_MARKUP_IDR||0)));
  const price=supplierPrice+markup;
  if(!verifiedOffer||!Number.isSafeInteger(supplierPrice)||supplierPrice<1||!Number.isSafeInteger(price)||price<1)return json(res,409,{error:'Penawaran sudah berubah atau tidak tersedia. Muat ulang daftar server.'});
  if(price!==submittedPrice)return json(res,409,{error:'Harga penawaran berubah. Periksa harga terbaru sebelum membeli.'});
  const custom_order_id=customOrderId();
  const {data:reserved,error:rErr}=await supabaseAdmin.rpc('reserve_order_balance',{p_user_id:user.id,p_amount:price});
  if(rErr)throw rErr; if(!reserved)return json(res,402,{error:'Saldo Anda Kurang'});
  const {error:insertErr}=await supabaseAdmin.from('orders').insert({user_id:user.id,custom_order_id,service_id:serviceId,service_name:serviceName,provider,country_code:countryCode,provider_id:providerId,amount:price,status:'allocating'});
  if(insertErr){await supabaseAdmin.rpc('refund_reserved_balance',{p_user_id:user.id,p_amount:price});throw insertErr;}
  const key=`${user.id}-${custom_order_id}`;
  let providerOrder;
  try{providerOrder=await nokos('/api/v1/orders',{method:'POST',headers:{'Idempotency-Key':key},body:JSON.stringify({service_id:serviceId,provider,country_code:countryCode,provider_id:providerId,quoted_price:supplierPrice})});}
  catch(e){
   if([400,401,403,404,422,429].includes(e.status)){await supabaseAdmin.rpc('refund_order_balance',{p_custom_order_id:custom_order_id});return json(res,e.status,{error:e.message});}
   await supabaseAdmin.from('orders').update({status:'allocation_uncertain'}).eq('custom_order_id',custom_order_id);
   return json(res,202,{custom_order_id,status:'allocation_uncertain',message:'Hasil alokasi belum dapat dipastikan. Saldo ditahan sementara; jangan membuat pesanan pengganti.'});
  }
  const providerOrderId=String(providerOrder.id||providerOrder.order_id||providerOrder.order?.id||'');
  const phone=providerOrder.phone||providerOrder.number||providerOrder.order?.phone||null;
  if(!providerOrderId){await supabaseAdmin.from('orders').update({status:'allocation_uncertain'}).eq('custom_order_id',custom_order_id);return json(res,202,{custom_order_id,status:'allocation_uncertain',message:'Hasil alokasi belum dapat dipastikan. Saldo ditahan sementara; jangan membuat pesanan pengganti.'});}
  const {data:order,error}=await supabaseAdmin.rpc('finalize_nokos_order',{p_custom_order_id:custom_order_id,p_provider_order_id:providerOrderId,p_phone:phone,p_status:providerOrder.status||'pending'});
  if(error)throw error;
  json(res,201,{order,custom_order_id});
 }catch(e){const status=Number.isInteger(e.status)?e.status:500;json(res,status,{error:status>=500?'Pesanan belum dapat diproses. Silakan periksa riwayat sebelum mencoba kembali.':e.message});}
}
