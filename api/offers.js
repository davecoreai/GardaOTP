import {json,method,auth,nokos,enforceRateLimit,supabaseAdmin} from '../lib/server.js';
export default async function handler(req,res){
 if(!method(req,res,['GET']))return;
 try{
  const user=await auth(req);
  const u=new URL(req.url,'http://localhost');
  const resource=u.searchParams.get('resource');
  const id=u.searchParams.get('service_id'),provider=u.searchParams.get('provider')||'provider_1';
  if(resource && resource!=='countries')return json(res,400,{error:'Jenis permintaan tidak valid.'});

  // Country lookup is served by this endpoint as well, keeping the Vercel Hobby
  // deployment within its Serverless Function limit without changing its API data shape.
  if(resource==='countries'){
   await enforceRateLimit(user.id,'countries',60);
   if(!id||id.length>80||!/^provider_[1-5]$/.test(provider))return json(res,400,{error:'Parameter layanan atau provider tidak valid.'});
   const data=await nokos(`/api/v1/services/${encodeURIComponent(id)}/countries?provider=${encodeURIComponent(provider)}`);
   return json(res,200,{data});
  }

  await enforceRateLimit(user.id,'offers',60);
  const country=u.searchParams.get('country_code');
  if(!id||id.length>80||!country||country.length>16||!/^provider_[1-5]$/.test(provider))return json(res,400,{error:'Parameter layanan, negara, atau provider tidak valid.'});
  const [{data:providerConfig,error:providerError},{data:serviceConfig,error:serviceError}] = await Promise.all([
   supabaseAdmin.from('admin_provider_settings').select('enabled,markup_idr,label').eq('provider_id',provider).maybeSingle(),
   supabaseAdmin.from('admin_service_settings').select('enabled').eq('service_id',id).maybeSingle()
  ]);
  if(providerError||serviceError)throw providerError||serviceError;
  if(providerConfig?.enabled===false)return json(res,403,{error:'Provider ini sedang dinonaktifkan oleh administrator.'});
  if(serviceConfig?.enabled===false)return json(res,403,{error:'Layanan ini sedang dinonaktifkan oleh administrator.'});
  const response=await nokos(`/api/v1/services/${encodeURIComponent(id)}/offers?provider=${encodeURIComponent(provider)}&country_code=${encodeURIComponent(country)}`);
  const rows=Array.isArray(response)?response:(response?.data||response?.offers||[]);
  const markup=Number(providerConfig?.markup_idr||0);
  const data=rows.map(row=>{const supplierPrice=Number(row.price);const price=supplierPrice+markup;return {...row,price:Number.isSafeInteger(price)&&price>0?price:null,server_label:row.server_label||providerConfig?.label||row.provider_id};}).filter(row=>Number.isSafeInteger(row.price)&&row.price>0);
  json(res,200,{data});
 }catch(e){json(res,e.status||502,{error:(e.status && e.status < 500) ? e.message : 'Layanan sementara tidak tersedia. Coba lagi.'});}
}
