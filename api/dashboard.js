import {json,method,auth,supabaseAdmin,nokos,enforceRateLimit} from '../lib/server.js';
export default async function handler(req,res){ if(!method(req,res,['GET']))return; try { const user=await auth(req); await enforceRateLimit(user.id,'dashboard',30,60); const [{data:profile,error:pErr},{data:rank,error:rErr},{data:stats,error:sErr},wallet]=await Promise.all([
 supabaseAdmin.from('profiles').select('id,display_name,balance,total_deposit').eq('id',user.id).single(),
 supabaseAdmin.from('leaderboard_public').select('display_name,total_deposit,total_order_value').limit(10),
 supabaseAdmin.from('global_stats').select('total_orders').eq('id',1).single(),
 process.env.NOKOS_API_KEY ? nokos('/api/v1/wallet').catch(()=>null) : Promise.resolve(null)
 ]); if(pErr) throw pErr; json(res,200,{profile,leaderboard:rank||[],totalOrders:stats?.total_orders||0,providerWallet:wallet}); } catch(e){json(res,e.status||500,{error:(e.status && e.status < 500) ? e.message : 'Layanan sementara tidak tersedia. Coba lagi.'});} }
