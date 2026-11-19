import {json,method,auth,supabaseAdmin,enforceRateLimit} from '../lib/server.js';

function readBody(req){
 if(req.body&&typeof req.body==='object')return req.body;
 if(typeof req.body==='string'){try{return JSON.parse(req.body);}catch{ return {}; }}
 return {};
}

export default async function handler(req,res){
 if(!method(req,res,['GET','POST']))return;
 try{
  const user=await auth(req);
  await enforceRateLimit(user.id,'referral',20,60);

  if(req.method==='POST'){
   const body=readBody(req);
   if(body.action!=='claim')return json(res,400,{error:'Aksi referral tidak valid.'});
   const code=String(body.code||'').trim().toUpperCase();
   if(!/^[A-Z0-9]{8}$/.test(code))return json(res,400,{error:'Kode referral tidak valid.'});

   const [{data:owner,error:ownerError},{data:current,error:currentError}]=await Promise.all([
    supabaseAdmin.from('profiles').select('id,referral_code').eq('referral_code',code).maybeSingle(),
    supabaseAdmin.from('profiles').select('id,referred_by').eq('id',user.id).maybeSingle()
   ]);
   if(ownerError)throw ownerError;
   if(currentError)throw currentError;
   if(!owner||!current)return json(res,404,{error:'Kode referral atau profil tidak ditemukan.'});
   if(owner.id===user.id)return json(res,400,{error:'Kode referral milik akun sendiri tidak dapat digunakan.'});
   if(current.referred_by)return json(res,200,{ok:true,applied:false,message:'Akun sudah terhubung dengan referral sebelumnya.'});

   const {data:updated,error:updateError}=await supabaseAdmin.from('profiles')
    .update({referred_by:owner.id}).eq('id',user.id).is('referred_by',null).select('id').maybeSingle();
   if(updateError)throw updateError;
   return json(res,200,{ok:true,applied:Boolean(updated),message:updated?'Referral berhasil diterapkan.':'Referral sudah pernah diterapkan.'});
  }

  const [{data:profile,error:profileError},{count:friends,error:friendsError},{data:rewardRows,error:rewardsError}]=await Promise.all([
   supabaseAdmin.from('profiles').select('referral_code,referral_bonus_total').eq('id',user.id).maybeSingle(),
   supabaseAdmin.from('profiles').select('id',{count:'exact',head:true}).eq('referred_by',user.id),
   supabaseAdmin.from('referral_rewards').select('referred_user_id,topup_amount,bonus_amount,created_at').eq('referrer_id',user.id).order('created_at',{ascending:false}).limit(50)
  ]);
  if(profileError)throw profileError;
  if(friendsError)throw friendsError;
  if(rewardsError)throw rewardsError;

  const ids=[...new Set((rewardRows||[]).map(row=>row.referred_user_id).filter(Boolean))];
  let names=new Map();
  if(ids.length){
   const {data:people,error:peopleError}=await supabaseAdmin.from('profiles').select('id,display_name,username').in('id',ids);
   if(peopleError)throw peopleError;
   names=new Map((people||[]).map(person=>[person.id,person]));
  }
  const history=(rewardRows||[]).map(row=>{
   const person=names.get(row.referred_user_id)||{};
   return {friend_name:person.display_name||null,friend_username:person.username||null,topup_amount:Number(row.topup_amount||0),bonus_amount:Number(row.bonus_amount||0),created_at:row.created_at};
  });
  const totalBonus=history.reduce((sum,row)=>sum+row.bonus_amount,0);
  return json(res,200,{referral_code:profile?.referral_code||null,total_bonus:Number(profile?.referral_bonus_total??totalBonus),total_friends:Number(friends||0),history});
 }catch(error){
  const status=error.status||500;
  const message=status<500?error.message:'Referral gagal dimuat. Pastikan migrasi referral sudah dijalankan di Supabase.';
  return json(res,status,{error:message});
 }
}
