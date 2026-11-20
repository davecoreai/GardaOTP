import {json,method,auth,supabaseAdmin,enforceRateLimit} from '../lib/server.js';
import {generateQrDataUrl} from '../lib/doku.js';
export default async function handler(req,res){
 if(!method(req,res,['GET']))return;
 try{
  const user=await auth(req);
  await enforceRateLimit(user.id,'history',30,60);
  const [{data:orders,error:oErr},{data:topups,error:tErr}]=await Promise.all([
   supabaseAdmin.from('orders').select('custom_order_id,provider_order_id,service_name,phone,amount,status,otp,has_receipt,can_cancel,expires_at,refund_eligible_at,cancel_requested_at,refunded_at,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50),
   supabaseAdmin.from('topups').select('merchant_ref_id,amount,status,payment_link,qr_link,expires_at,paid_at,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30)
  ]);
  if(oErr)throw oErr;if(tErr)throw tErr;
  const enrichedTopups=await Promise.all((topups||[]).map(async row=>{
   const isPending=String(row.status||'').toLowerCase()==='pending';
   const qrSource=isPending?(row.qr_link||row.payment_link||''):'';
   const qr_data_url=qrSource?await generateQrDataUrl(qrSource).catch(()=>null):null;
   return {...row,qr_data_url,is_direct_qris:Boolean(row.qr_link)};
  }));
  json(res,200,{orders,topups:enrichedTopups});
 }catch(e){json(res,e.status||500,{error:(e.status&&e.status<500)?e.message:'Layanan sementara tidak tersedia. Coba lagi.'});}
}
