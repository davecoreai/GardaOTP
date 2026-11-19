import {json,method,auth,nokos,supabaseAdmin,enforceRateLimit} from '../lib/server.js';
export default async function handler(req,res){
 if(!method(req,res,['GET']))return;
 try{
  const user=await auth(req);
  await enforceRateLimit(user.id,'catalog',30);
  const q=new URL(req.url,'http://localhost').searchParams.get('q')||'';
  if(q.length>100)return json(res,400,{error:'Kata pencarian terlalu panjang.'});
  const upstream=await nokos(`/api/v1/services${q?`?q=${encodeURIComponent(q)}`:''}`);
  const data=upstream;
  // Popularity is aggregated server-side; never expose other users' order records.
  const {data:popularRows,error:popularError}=await supabaseAdmin.rpc('get_popular_services',{p_limit:500});
  if(popularError)console.warn('Popular services SQL migration not applied yet:',popularError.message);
  const popular=Array.isArray(popularRows)?popularRows:[];
  json(res,200,{data,popular:popular.map(row=>({service_id:String(row.service_id),order_count:Number(row.order_count||0)}))});
 }catch(e){json(res,e.status||502,{error:(e.status && e.status < 500) ? e.message : 'Layanan sementara tidak tersedia. Coba lagi.'});}
}
