const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const money = n => new Intl.NumberFormat((navigator.language||'id-ID'),{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const deviceLocale = (navigator.languages?.[0] || navigator.language || 'id').toLowerCase();
const uiLang = /^id(?:-|$)/i.test(deviceLocale) ? 'id' : 'en';
const dateLocale = uiLang === 'id' ? 'id-ID' : deviceLocale;
const translations = {
  en: {
    'Selamat datang': 'Welcome', 'Beranda': 'Home', 'Beli': 'Buy', 'Top up': 'Top up', 'Riwayat': 'History', 'Profil': 'Profile',
    'Beli nomor': 'Buy number', 'Beli nomor.': 'Buy a number.', 'Riwayat transaksi.': 'Transaction history.',
    'Peringkat pengguna': 'User leaderboard', 'PERINGKAT / PENGGUNA': 'RANK / USER', 'TOTAL DEPOSIT': 'TOTAL DEPOSIT', 'NILAI PESANAN': 'ORDER VALUE',
    'Peringkat diperbarui otomatis saat transaksi berubah.': 'Rankings update automatically when transactions change.',
    'TOTAL PESANAN': 'TOTAL ORDERS', 'Pesanan seluruh pengguna': 'Orders from all users', 'Saldo akun': 'Account balance',
    'Pilih negara': 'Choose a country', 'Pilih aplikasi terlebih dahulu': 'Choose a service first', 'Memuat negara...': 'Loading countries...',
    'Pilih negara...': 'Choose a country...', 'Pilih negara untuk melihat server.': 'Choose a country to view available servers.',
    'Pilih aplikasi dan negara untuk melihat penawaran server.': 'Choose a service and country to view server offers.',
    'Memuat penawaran...': 'Loading offers...', 'Tidak ada server tersedia untuk pilihan ini.': 'No servers available for this selection.',
    'Gagal memuat negara': 'Could not load countries', 'Negara tujuan': 'Destination country', 'Pilihan server': 'Server options',
    'Aplikasi populer': 'Popular services', 'Cari WhatsApp, Telegram, Google...': 'Search WhatsApp, Telegram, Google...',
    'Mengambil katalog layanan...': 'Loading service catalog...', 'Layanan tidak ditemukan.': 'No services found.',
    'Pilih nominal': 'Choose amount', 'Metode pembayaran': 'Payment method', 'SALDO SAAT INI': 'CURRENT BALANCE',
    'Isi saldo dengan pembayaran QRIS yang praktis.': 'Add balance easily using QRIS.', 'Pembelian nomor': 'Number purchases',
    'Semua pembelian nomor dan top up kamu.': 'Your number purchases and top-ups.', 'Akun aktif': 'Account active', 'AKUN AKTIF': 'ACCOUNT ACTIVE',
    'Edit nama': 'Edit name', 'Keluar akun': 'Sign out', 'Lanjutkan pembayaran': 'Continue to payment', 'Pilih aplikasi dan server terbaik sesuai kebutuhanmu.':'Choose the service and server that best fit your needs.',
    'Saldo setelah beli': 'Balance after purchase', 'Total harga': 'Total price', 'Beli nomor sekarang': 'Buy number now',
    'Scan dari bank atau e-wallet': 'Scan with a bank or e-wallet', 'Belum ada data deposit.': 'No deposit data yet.',
    'Memuat papan peringkat...': 'Loading leaderboard...', 'Memuat riwayat...': 'Loading history...', 'Pilih nominal':'Choose amount', 'Ringkasan pesanan':'Order summary', 'Metode pembayaran':'Payment method', 'Belum ada transaksi.': 'No transactions yet.',
    'Layanan sementara tidak tersedia. Coba lagi.': 'Service temporarily unavailable. Please try again.',
    'Peringkat diperbarui otomatis saat transaksi berubah.': 'Rankings update automatically as transactions change.',
    'TOTAL BALANCE': 'TOTAL BALANCE', 'Mulai beli nomor': 'Buy a number', 'Verifikasi lebih mudah.': 'Verify with ease.',
    'Pilih aplikasi, server, dan negara dalam beberapa langkah.': 'Choose a service, server, and country in a few steps.',
    'Pilih aplikasi dan server terbaik sesuai kebutuhanmu.': 'Choose the best service and server for your needs.',
    'Pilih aplikasi dan negara untuk melihat penawaran server.': 'Choose a service and country to view server offers.',
    'Negara tujuan': 'Destination country', 'Aplikasi populer': 'Popular services', 'Pilihan server': 'Server options',
    'Pilih nominal': 'Choose an amount', 'Metode pembayaran': 'Payment method', 'Pembelian nomor': 'Number purchases',
    'Top up': 'Top up', 'Semua pembelian nomor dan top up kamu.': 'Your number purchases and top-ups.',
    'Isi saldo dengan pembayaran QRIS yang praktis.': 'Add balance easily using QRIS.', 'Available balance': 'Available balance',
    'Saldo akun': 'Account balance', 'Pilih negara untuk melihat server.': 'Choose a country to view servers.',
    'Pilih negara untuk melihat penawaran server.': 'Choose a country to view offers.',
    'Memuat katalog layanan live...': 'Loading live service catalog...', 'Mengambil katalog layanan...': 'Loading service catalog...',
    'Layanan tidak ditemukan.': 'No services found.', 'Tidak ada server tersedia untuk pilihan ini.': 'No servers available for this selection.',
    'Memuat penawaran...': 'Loading offers...', 'Memuat negara...': 'Loading countries...', 'Pilih negara...': 'Choose a country...',
    'Pilih aplikasi terlebih dahulu': 'Choose a service first', 'Gagal memuat negara': 'Could not load countries',
    'Lanjutkan pembayaran': 'Continue to payment', 'Scan dari bank atau e-wallet': 'Scan with a bank or e-wallet',
    'Beli nomor sekarang': 'Buy number now', 'Saldo setelah beli': 'Balance after purchase', 'Total harga': 'Total price',
    'Layanan sementara tidak tersedia. Coba lagi.': 'Service temporarily unavailable. Please try again.',
    'Belum ada data deposit.': 'No deposit data yet.', 'Belum ada transaksi.': 'No transactions yet.',
    'Memuat papan peringkat...': 'Loading leaderboard...', 'Memuat riwayat...': 'Loading history...', 'Pilih nominal':'Choose amount', 'Ringkasan pesanan':'Order summary', 'Metode pembayaran':'Payment method',
    'Peringkat pengguna': 'User leaderboard', 'PERINGKAT / PENGGUNA': 'RANK / USER', 'NILAI PESANAN': 'ORDER VALUE',
    'Pesanan seluruh pengguna': 'Orders across all users', 'SALDO SAAT INI': 'CURRENT BALANCE',
    'Edit nama': 'Edit name', 'Keluar akun': 'Sign out', 'AKUN AKTIF': 'ACCOUNT ACTIVE',
    'Verifikasi email': 'Verify email', 'Masukkan kode 6 digit yang dikirim ke email kamu.': 'Enter the 6-digit code sent to your email.',
    'Verifikasi akun': 'Verify account', 'Kirim ulang kode': 'Resend code', 'Pilih layanan terlebih dahulu': 'Choose a service first',
    'Harga dan stok mengikuti penawaran live provider. Harga dikunci saat konfirmasi.': 'Price and stock follow live provider offers. The price is checked again at confirmation.',
    'Tagihan QRIS memiliki batas waktu. Saldo hanya bertambah setelah webhook SekaliPay terverifikasi.': 'QRIS invoices expire. Your balance is credited only after the SekaliPay webhook is verified.',
        'Verifikasi digital,':'Digital verification,','lebih praktis.':'made simple.','SoraOTP menyediakan akses pemesanan nomor virtual untuk kebutuhan penerimaan kode verifikasi pada layanan yang tersedia. Pilih layanan, negara, dan penawaran server, lalu kelola pesanan dari satu dashboard.':'SoraOTP lets you order virtual numbers to receive verification codes on supported services. Choose a service, country, and server offer, then manage orders from one dashboard.',
    'Mulai sekarang':'Get started','Lihat cara penggunaan':'How it works','Ketersediaan nomor, harga, dan masa aktif mengikuti informasi yang diberikan provider saat pemesanan.':'Number availability, pricing, and validity depend on provider information at the time of order.',
    'Semua kebutuhan OTP dalam satu tempat.':'All your OTP needs in one place.','Kelola proses pemesanan dan transaksi dengan alur yang jelas, mulai dari memilih layanan sampai memeriksa status pesanan.':'Manage orders and transactions through a clear flow, from choosing a service to checking order status.',
    'Katalog layanan':'Service catalog','Temukan aplikasi dan platform yang tersedia dari katalog provider.':'Find available apps and platforms in the provider catalog.','Pilihan negara':'Country selection','Pilih negara berdasarkan ketersediaan untuk layanan yang dipilih.':'Choose a country based on availability for the selected service.',
    'Harga dan stok server':'Server prices and stock','Periksa harga dan stok dari penawaran server sebelum membeli.':'Check server prices and stock before purchasing.','Pembayaran QRIS':'QRIS payments','Buat tagihan top up dan scan QRIS yang diterbitkan untuk transaksi tersebut.':'Create a top-up invoice and scan the QRIS issued for that transaction.',
    'Riwayat transaksi':'Transaction history','Periksa referensi, nominal, dan status pembelian maupun top up.':'Check references, amounts, and purchase or top-up status.','Saldo akun':'Account balance','Pantau saldo akun dan gunakan untuk transaksi pembelian nomor.':'Monitor your balance and use it to purchase numbers.',
    'Alur penggunaan yang sederhana.':'A simple way to get started.','Setiap pembelian dilakukan melalui akun SoraOTP. Periksa detail pesanan sebelum mengonfirmasi transaksi.':'Every purchase is made through your SoraOTP account. Review order details before confirming.',
    'Daftar atau masuk':'Sign up or sign in','Buat akun menggunakan email, lalu masuk untuk membuka dashboard pribadi.':'Create an account with your email, then sign in to open your dashboard.','Pilih layanan dan negara':'Choose a service and country','Cari layanan tujuan, pilih negara, lalu lihat server yang tersedia.':'Find the service you need, choose a country, and view available servers.',
    'Periksa penawaran':'Review offers','Pastikan harga, stok, dan saldo sudah sesuai sebelum mengirim pesanan.':'Check the price, stock, and balance before placing an order.','Pantau pesanan':'Track your order','Lihat detail dan status pesanan melalui halaman riwayat akun.':'View order details and status in your account history.',
    'Pembayaran dan saldo':'Payments and balance','Top up dilakukan dengan membuat tagihan QRIS. Gunakan QRIS yang muncul pada tagihan aktif dan selesaikan pembayaran sebelum batas waktu berakhir. Saldo hanya diperbarui setelah pembayaran berhasil diverifikasi oleh sistem pembayaran.':'Top up by creating a QRIS invoice. Pay using the QRIS shown on the active invoice before it expires. Your balance is updated only after the payment provider verifies the payment.',
    'Informasi nomor virtual':'Virtual number information','Nomor virtual disediakan berdasarkan stok provider. Penerimaan kode OTP dapat dipengaruhi oleh kebijakan aplikasi tujuan, negara, dan kondisi nomor. SoraOTP tidak menjamin setiap nomor dapat digunakan pada seluruh layanan.':'Virtual numbers are supplied based on provider stock. OTP delivery may depend on the destination app, country, and number status. SoraOTP cannot guarantee that every number works with every service.',
    'Penggunaan yang bertanggung jawab':'Responsible use','Gunakan layanan sesuai hukum dan ketentuan platform tujuan. Jangan gunakan nomor untuk penipuan, spam, penyamaran identitas, atau aktivitas yang melanggar hak orang lain.':'Use the service lawfully and follow the destination platform rules. Do not use numbers for fraud, spam, impersonation, or activities that violate others’ rights.',
    'Pertanyaan yang sering diajukan.':'Frequently asked questions.','Apa itu SoraOTP?':'What is SoraOTP?','Apakah semua aplikasi dan negara tersedia?':'Are all apps and countries available?','Bagaimana cara mengisi saldo?':'How do I add balance?','Kapan saldo akan masuk?':'When will my balance be credited?','Apakah nomor pasti menerima OTP?':'Will the number definitely receive an OTP?','Di mana saya melihat status pesanan?':'Where can I check my order status?',
    'Mulai gunakan SoraOTP.':'Start using SoraOTP.','Buat akun untuk melihat katalog, penawaran server, dan transaksi dari dashboard.':'Create an account to view the catalog, server offers, and transactions from your dashboard.','Masuk ke SoraOTP':'Open SoraOTP','Nomor virtual dan layanan verifikasi.':'Virtual numbers and verification services.','Seluruh hak cipta dilindungi.':'All rights reserved.',
    'Masuk ke akun':'Sign in to your account','Masuk untuk melanjutkan ke dashboard SoraOTP.':'Sign in to continue to your SoraOTP dashboard.','Buat akun':'Create account','Lengkapi data berikut untuk membuat akun SoraOTP.':'Complete the details below to create your SoraOTP account.','Login Dengan Google':'Continue with Google','atau dengan email':'or continue with email','Nama':'Name','Nama lengkap':'Full name','Minimal 8 karakter':'At least 8 characters','Belum punya akun? Daftar':'New here? Sign up','Sudah punya akun? Masuk':'Already have an account? Sign in',
    'Beli':'Buy','nomor.':'number.','transaksi.':'history.','Top up':'Top up','stok':'stock','tersedia':'available','LANGKAH 01':'STEP 01','LANGKAH 02':'STEP 02','LANGKAH 03':'STEP 03','LANGSUNG':'LIVE','AKTIF':'ACTIVE'
  },
  id: {
    'TOTAL BALANCE':'TOTAL SALDO','GLOBAL ORDERS':'TOTAL PESANAN','TODAY':'HARI INI','AVAILABLE BALANCE':'SALDO TERSEDIA',
    'STEP 01':'LANGKAH 01','STEP 02':'LANGKAH 02','STEP 03':'LANGKAH 03','LIVE CATALOG':'KATALOG AKTIF','LIVE PRICE & STOCK':'HARGA & STOK LIVE',
    'ORDER SUMMARY':'RINGKASAN PESANAN','YOUR OTP CODE':'KODE OTP ANDA','LIVE SERVICES':'LAYANAN AKTIF','RANK / USER':'PERINGKAT / PENGGUNA',
    'TOTAL ORDER VALUE':'NILAI TOTAL PESANAN','GLOBAL RANKING':'PERINGKAT GLOBAL','SoraOTP — Verification, Simplified':'SoraOTP — Verifikasi Lebih Praktis',
    'Verification, simplified.':'Verifikasi lebih praktis.','All your OTP needs in one place.':'Semua kebutuhan OTP dalam satu tempat.',
    'Popular services':'Layanan populer','Choose a country':'Pilih negara','Server options':'Pilihan server','CURRENT BALANCE':'SALDO SAAT INI',
    'EMAIL VERIFICATION':'VERIFIKASI EMAIL','YOUR VERIFICATION CODE':'KODE VERIFIKASI ANDA','ACCOUNT SECURITY':'KEAMANAN AKUN',
    'COPY CODE':'SALIN KODE','SECURITY NOTICE':'INFORMASI KEAMANAN','PROFILE':'PROFIL','HOME':'BERANDA','BUY':'BELI',
    'HISTORY':'RIWAYAT','SIGN OUT':'KELUAR','AVAILABLE':'TERSEDIA','available':'tersedia','Pilih server':'Choose a server','Total harga':'Total price','Saldo akun':'Account balance','Beli nomor sekarang':'Buy number now','Lanjutkan pembayaran':'Continue to payment','Pembelian nomor':'Number purchases','Top up saldo':'Add balance','Menunggu alokasi':'Awaiting allocation','Tidak ada server tersedia untuk pilihan ini.':'No servers available for this selection.','TOTAL DEPOSIT':'TOTAL DEPOSIT','Beli':'Buy','nomor.':'number.','transaksi.':'history.','stok':'stock','LANGSUNG':'LIVE',
    'VERIFIKASI DIGITAL':'DIGITAL VERIFICATION','BERANDA':'HOME','LAYANAN AKTIF':'LIVE SERVICES','PILIH LAYANAN':'CHOOSE A SERVICE'
  }
};
const tr = value => (translations[uiLang] || {})[value] || value;
function localize(root=document){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{const raw=node.nodeValue;const trimmed=raw.trim();if(!trimmed)return;const translated=tr(trimmed);if(translated!==trimmed)node.nodeValue=raw.replace(trimmed,translated);});
  root.querySelectorAll?.('[placeholder],[aria-label],[title]').forEach(el=>['placeholder','aria-label','title'].forEach(attr=>{const v=el.getAttribute(attr);if(v)el.setAttribute(attr,tr(v));}));
}
function serviceIcon(name=''){
 const n=String(name).toLowerCase();
 if(/whatsapp/.test(n))return 'fa-brands fa-whatsapp';
 if(/telegram/.test(n))return 'fa-brands fa-telegram';
 if(/discord/.test(n))return 'fa-brands fa-discord';
 if(/instagram/.test(n))return 'fa-brands fa-instagram';
 if(/facebook/.test(n))return 'fa-brands fa-facebook';
 if(/google|gmail/.test(n))return 'fa-brands fa-google';
 if(/tiktok/.test(n))return 'fa-brands fa-tiktok';
 if(/microsoft|outlook/.test(n))return 'fa-brands fa-microsoft';
 if(/github/.test(n))return 'fa-brands fa-github';
 if(/openai|chatgpt/.test(n))return 'fa-solid fa-robot';
 if(/dana|ovo|gopay|shopee|lazada|tokopedia/.test(n))return 'fa-solid fa-wallet';
 return 'fa-solid fa-mobile-screen-button';
}
let sb=null, session=null, profile=null, services=[], selectedService=null, countries=[], selectedCountry=null, offers=[], selectedOffer=null, provider='provider_1', selectedAmount=0, historyMode='orders';
let leaderboardChannel=null, leaderboardFallback=null, liveRefreshQueued=false;
async function api(path, opts={}) { const token=session?.access_token; const res=await fetch(`/api/${path}`,{...opts,headers:{...(opts.body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`} : {}),...(opts.headers||{})}}); const data=await res.json().catch(()=>({})); if(!res.ok) throw Object.assign(new Error(data.error||`Request gagal (${res.status})`),{status:res.status,data}); return data; }
function alertError(message){Swal.fire({icon:'error',title:'Terjadi kendala',text:message,confirmButtonText:'Mengerti'});}
function showLanding(){ $('#app').classList.add('hidden'); $('#authScreen').classList.add('hidden'); $('#landingScreen').classList.remove('hidden'); }
function showAuth(){ $('#landingScreen').classList.add('hidden'); $('#app').classList.add('hidden'); $('#authScreen').classList.remove('hidden'); }
function showApp(){ $('#landingScreen').classList.add('hidden'); $('#authScreen').classList.add('hidden'); $('#app').classList.remove('hidden'); }
function setPage(name){ $$('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${name}`)); $$('.nav-item').forEach((b,i)=>b.classList.toggle('active',b.dataset.page===name)); const idx=['home','buy','topup','history','profile'].indexOf(name); $('.nav-indicator').style.transform=`translateX(${idx*100}%)`; if(name==='buy')loadCatalog(); if(name==='history')loadHistory(); if(name==='home')loadDashboard(); if(name==='profile')renderProfile(); if(name==='topup')refreshProfile(); localize(document.querySelector(`#page-${name}`)); window.scrollTo({top:0,behavior:'smooth'}); }
$$('[data-page]').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.page)));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.go)));
$('#headerAvatar').addEventListener('click',()=>setPage('profile'));

async function init(){
 try { const cfg=await fetch('/api/public-config').then(r=>r.json()); if(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase){ sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey); const {data}=await sb.auth.getSession(); session=data.session; sb.auth.onAuthStateChange((_event,s)=>{session=s; if(s){showApp();bootstrap();}else{stopLeaderboardRealtime();showLanding();}}); } } catch(e){console.warn('Supabase config unavailable',e);}
 if(session){showApp();await bootstrap();} else showLanding();
 $('#todayLabel').textContent=new Intl.DateTimeFormat(dateLocale,{weekday:'short',day:'2-digit',month:'short'}).format(new Date()).toUpperCase();
 $('#landingYear').textContent=new Date().getFullYear();document.documentElement.lang=uiLang;document.documentElement.setAttribute('translate','yes');localize(document.body);
}
$('#landingLogin').addEventListener('click',showAuth);
$('#landingLoginMobile').addEventListener('click',()=>{ $('#landingMenu').classList.remove('open'); $('#menuToggle').setAttribute('aria-expanded','false'); showAuth(); });
$('#menuToggle').addEventListener('click',()=>{const open=$('#landingMenu').classList.toggle('open');$('#menuToggle').setAttribute('aria-expanded',String(open));$('#menuToggle i').className=open?'fa-solid fa-xmark':'fa-solid fa-bars';});
$$('#landingMenu a').forEach(a=>a.addEventListener('click',()=>$('#landingMenu').classList.remove('open')));
$('#googleLogin').addEventListener('click',async()=>{if(!sb)return alertError('Konfigurasi Supabase belum tersedia.');const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}});if(error)alertError(error.message);});
$('#landingStart').addEventListener('click',showAuth);
$('#landingBottomStart').addEventListener('click',showAuth);

let registering=false, pendingEmail='', pendingPassword='', pendingUsername='', pendingName='';
function setAuthMode(isRegister){registering=isRegister;$('#authTitle').textContent=isRegister?'Buat akun':'Masuk ke akun';$('#authSubtitle').textContent=isRegister?'Lengkapi data berikut untuk membuat akun SoraOTP.':'Masuk untuk melanjutkan ke dashboard SoraOTP.';$('#nameField').classList.toggle('hidden',!isRegister);$('#usernameField').classList.toggle('hidden',!isRegister);$('#authName').required=isRegister;$('#authUsername').required=isRegister;$('#authPassword').autocomplete=isRegister?'new-password':'current-password';$('#passwordMeter').classList.toggle('hidden',!isRegister);$('#authSubmit').textContent=isRegister?'Buat akun':'Masuk';$('#authToggle').textContent=isRegister?'Sudah punya akun? Masuk':'Belum punya akun? Daftar';$('#emailOtpPanel').classList.add('hidden');$('#authForm').classList.remove('hidden');$('#googleLogin').classList.toggle('hidden',isRegister);}
$('#authToggle').addEventListener('click',()=>{setAuthMode(!registering);localize($('#authScreen'));});
$('#authPassword').addEventListener('input',()=>{const v=$('#authPassword').value;let score=0;if(v.length>=8)score++;if(/[a-z]/.test(v)&&/[A-Z]/.test(v))score++;if(/\d/.test(v))score++;if(/[^A-Za-z0-9]/.test(v))score++;$('#passwordStrength').style.width=(score*25)+'%';$('#passwordStrength').dataset.level=String(score);$('#passwordHint').textContent=(uiLang==='id'?['Sangat lemah','Lemah','Cukup','Kuat','Sangat kuat']:['Very weak','Weak','Fair','Strong','Very strong'])[score];});
$('#authUsername').addEventListener('input',e=>{e.target.value=e.target.value.toLowerCase().replace(/[^a-z0-9]/g,'');});
$('#authForm').addEventListener('submit',async e=>{e.preventDefault();if(!sb)return alertError('Isi SUPABASE_URL dan SUPABASE_ANON_KEY di Environment Variables Vercel, lalu deploy ulang.');const email=$('#authEmail').value.trim().toLowerCase(),password=$('#authPassword').value;$('#authSubmit').disabled=true;try{if(registering){const username=$('#authUsername').value.trim(),name=$('#authName').value.trim();if(!/^[a-z0-9]{3,20}$/.test(username))throw new Error('Username harus 3–20 karakter, hanya huruf kecil dan angka.');if(password.length<8)throw new Error('Password minimal 8 karakter.');const {data:available,error:lookupError}=await sb.rpc('username_available',{p_username:username});if(lookupError)throw lookupError;if(available!==true)throw new Error('Username sudah digunakan. Silakan pilih username lain.');const result=await sb.auth.signUp({email,password,options:{data:{display_name:name,username},emailRedirectTo:window.location.origin}});if(result.error)throw result.error;pendingEmail=email;pendingPassword=password;pendingUsername=username;pendingName=name;$('#authForm').classList.add('hidden');$('#googleLogin').classList.add('hidden');$('#authToggle').classList.add('hidden');$('#emailOtpPanel').classList.remove('hidden');Swal.fire({icon:'success',title:'Kode verifikasi dikirim',text:`Periksa email ${email} dan masukkan kode 6 digit.`});}else{const result=await sb.auth.signInWithPassword({email,password});if(result.error)throw result.error;session=result.data.session;showApp();await bootstrap();}}catch(err){alertError(err.message);}finally{$('#authSubmit').disabled=false;}});
function readOtp(){return $$('#otpInputs input').map(x=>x.value).join('');}
$$('#otpInputs input').forEach((input,i,all)=>{input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,1);if(input.value&&all[i+1])all[i+1].focus();});input.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!input.value&&all[i-1])all[i-1].focus();});});
$('#verifyOtp').addEventListener('click',async()=>{const token=readOtp();if(token.length!==6)return alertError('Masukkan seluruh 6 digit kode OTP.');$('#verifyOtp').disabled=true;try{const {data,error}=await sb.auth.verifyOtp({email:pendingEmail,token,type:'signup'});if(error)throw error;session=data.session;if(!session){const login=await sb.auth.signInWithPassword({email:pendingEmail,password:pendingPassword});if(login.error)throw login.error;session=login.data.session;}showApp();await bootstrap();}catch(e){alertError(e.message);}finally{$('#verifyOtp').disabled=false;}});
$('#resendOtp').addEventListener('click',async()=>{try{const {error}=await sb.auth.resend({type:'signup',email:pendingEmail});if(error)throw error;Swal.fire({icon:'success',title:'Kode dikirim ulang',text:'Periksa kotak masuk dan folder spam.'});}catch(e){alertError(e.message);}});
async function bootstrap(){await loadDashboard();renderProfile();startLeaderboardRealtime();}
async function startLeaderboardRealtime(){
 if(!sb||!session?.access_token)return;
 if(leaderboardChannel){await sb.removeChannel(leaderboardChannel);leaderboardChannel=null;}
 if(leaderboardFallback)clearInterval(leaderboardFallback);
 try{
  await sb.realtime.setAuth(session.access_token);
  leaderboardChannel=sb.channel('leaderboard:global',{config:{private:true}})
   .on('broadcast',{event:'leaderboard-update'},()=>{
    if(liveRefreshQueued)return;
    liveRefreshQueued=true;
    setTimeout(async()=>{liveRefreshQueued=false;await loadDashboard();},200);
   })
   .subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')console.warn('Leaderboard Realtime status:',status);});
 }catch(error){console.warn('Leaderboard Realtime unavailable; refresh fallback enabled.',error);}
 // Safety refresh in case a websocket reconnect or a database broadcast is missed.
 leaderboardFallback=setInterval(()=>{if(session?.access_token)loadDashboard();},30000);
}
function stopLeaderboardRealtime(){if(leaderboardFallback)clearInterval(leaderboardFallback);leaderboardFallback=null;if(leaderboardChannel&&sb)sb.removeChannel(leaderboardChannel);leaderboardChannel=null;}
async function refreshProfile(){try{const d=await api('dashboard');profile=d.profile;$('#topupBalance').textContent=money(profile.balance);$('#homeBalance').textContent=money(profile.balance);}catch(e){console.error(e);}}
async function loadDashboard(){
 try{const d=await api('dashboard');profile=d.profile;$('#homeBalance').textContent=money(profile.balance);$('#topupBalance').textContent=money(profile.balance);$('#globalOrders').textContent=Number(d.totalOrders||0).toLocaleString(uiLang==='id'?'id-ID':'en-US');$('#leaderboard').innerHTML=(d.leaderboard||[]).length?d.leaderboard.map((r,i)=>leaderRow([r.display_name,r.total_deposit,r.total_order_value],i)).join(''):`<div class="empty-state">${tr('Belum ada data deposit.')}</div>`;updateWelcome();localize($('#leaderboard')); }catch(e){$('#leaderboard').innerHTML=`<div class="empty-state">${esc(e.message)}</div>`;}
}
function leaderRow(r,i){return `<div class="leader-row"><div class="leader-user"><span class="rank ${i<3?'top':''}">${i+1}</span><span>${esc(r[0])}</span></div><strong>${money(r[1])}</strong><strong class="value-muted">${money(r[2])}</strong></div>`;}
function updateWelcome(){const name=profile?.display_name||session?.user?.user_metadata?.display_name||session?.user?.email?.split('@')[0]|| (uiLang==='id'?'Pengguna':'User');$('#welcomeTitle').textContent=`${uiLang==='id'?'Selamat datang':'Welcome'}, ${name}`;}
function renderProfile(){const name=profile?.display_name||session?.user?.user_metadata?.display_name||session?.user?.email?.split('@')[0]||'Pengguna';$('#profileName').textContent=name;$('#profileEmail').textContent=session?.user?.email||'';$('#profileAvatar').textContent=name.slice(0,1).toUpperCase();$('#headerAvatar').textContent=name.slice(0,1).toUpperCase();updateWelcome();localize($('#page-profile'));}
$('#editName').addEventListener('click',async()=>{const {value}=await Swal.fire({title:'Ubah nama tampilan',input:'text',inputValue:profile?.display_name||'',showCancelButton:true,confirmButtonText:'Simpan',inputValidator:v=>!v?.trim()?'Nama tidak boleh kosong':undefined});if(!value)return;const {error}=await sb.from('profiles').update({display_name:value.trim()}).eq('id',session.user.id);if(error)return alertError(error.message);profile.display_name=value.trim();renderProfile();});
$('#logoutButton').addEventListener('click',async()=>{stopLeaderboardRealtime();if(sb)await sb.auth.signOut();session=null;showLanding();});

async function loadCatalog(query=''){
 $('#serviceGrid').innerHTML=`<div class="loading-card glass">${tr('Memuat katalog layanan live...')}</div>`;
 try{const d=await api(`catalog${query?`?q=${encodeURIComponent(query)}`:''}`);services=Array.isArray(d.data)?d.data:(d.data?.data||[]);renderServices();$('#serviceCount').textContent=uiLang==='id'?`${services.length} LAYANAN AKTIF`:`${services.length} LIVE SERVICES`;localize($('#page-buy'));}
 catch(e){$('#serviceGrid').innerHTML=`<div class="loading-card glass">${esc(e.message)}</div>`;}
}
function renderServices(){const q=$('#serviceSearch').value.toLowerCase();const list=services.filter(s=>String(s.name).toLowerCase().includes(q)||String(s.slug||'').includes(q));$('#serviceGrid').innerHTML=list.length?list.map(s=>`<button class="service-card ${selectedService?.id===s.id?'selected':''}" data-service="${esc(s.id)}"><span class="service-logo"><i class="${serviceIcon(s.name)}" aria-hidden="true"></i></span><span class="service-meta"><b>${esc(s.name)}</b><small>${Number(s.stock||0)} ${uiLang==='id'?'tersedia':'available'} · ${money(s.price)}</small></span></button>`).join(''):`<div class="loading-card glass">${tr('Layanan tidak ditemukan.')}</div>`;$$('[data-service]').forEach(b=>b.addEventListener('click',()=>chooseService(b.dataset.service)));localize($('#serviceGrid'));}
$('#serviceSearch').addEventListener('input',()=>renderServices());
async function chooseService(id){selectedService=services.find(s=>String(s.id)===String(id));selectedOffer=null;renderServices();updateSummary();await loadCountries();}
function renderCountryDropdown(){
 const list=$('#countryDropdownList'),button=$('#countryDropdownButton'),label=$('#countryDropdownLabel');
 button.disabled=!countries.length;
 label.textContent=selectedCountry?(countries.find(c=>String(c.country_code??c.code??c.id)===selectedCountry)?.name||countries.find(c=>String(c.country_code??c.code??c.id)===selectedCountry)?.country_name||selectedCountry):tr(countries.length?'Pilih negara...':'Pilih aplikasi terlebih dahulu');
 list.innerHTML=countries.map(c=>{const code=String(c.country_code??c.code??c.id??'');const name=String(c.name??c.country_name??c.title??code);const flag='<i class="fa-solid fa-earth-asia country-flag-icon" aria-hidden="true"></i>';return `<button type="button" class="country-option ${selectedCountry===code?'selected':''}" role="option" aria-selected="${selectedCountry===code}" data-country-code="${esc(code)}">${flag}<span>${esc(name)}</span>${selectedCountry===code?'<i class="fa-solid fa-check" aria-hidden="true"></i>':''}</button>`;}).join('');
 list.querySelectorAll('[data-country-code]').forEach(option=>option.addEventListener('click',async()=>{
  selectedCountry=option.dataset.countryCode;$('#countrySelect').value=selectedCountry;list.classList.add('hidden');button.setAttribute('aria-expanded','false');renderCountryDropdown();selectedOffer=null;await loadOffers();updateSummary();
 }));
 localize(list);
}
$('#countryDropdownButton').addEventListener('click',()=>{const list=$('#countryDropdownList');const opening=list.classList.contains('hidden');list.classList.toggle('hidden',!opening);$('#countryDropdownButton').setAttribute('aria-expanded',String(opening));});
document.addEventListener('click',e=>{if(!e.target.closest('.country-dropdown-wrap')){$('#countryDropdownList')?.classList.add('hidden');$('#countryDropdownButton')?.setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#countryDropdownList')?.classList.add('hidden');$('#countryDropdownButton')?.setAttribute('aria-expanded','false');}});
async function loadCountries(){const select=$('#countrySelect');select.innerHTML='<option value=""></option>';$('#offerList').innerHTML=`<div class="empty-state">${tr('Pilih negara untuk melihat penawaran server.')}</div>`;countries=[];selectedCountry=null;renderCountryDropdown();if(!selectedService)return;
 try{const d=await api(`countries?service_id=${encodeURIComponent(selectedService.id)}&provider=${provider}`);const data=Array.isArray(d.data)?d.data:(d.data?.data||[]);countries=data.sort((a,b)=>(a.name||a.country_name||'').localeCompare(b.name||b.country_name||''));select.innerHTML='<option value=""></option>'+countries.map(c=>{const code=c.country_code??c.code??c.id;return `<option value="${esc(code)}">${esc(c.name??c.country_name??c.title??code)}</option>`;}).join('');renderCountryDropdown();}catch(e){$('#countryDropdownLabel').textContent=uiLang==='id'?'Gagal memuat negara':'Could not load countries';alertError(e.message);}}
$$('.provider-tab').forEach(b=>b.addEventListener('click',async()=>{$$('.provider-tab').forEach(x=>x.classList.toggle('active',x===b));const previousCountry=selectedCountry;provider=b.dataset.provider;selectedOffer=null;if(selectedService){await loadCountries();const found=countries.find(c=>String(c.country_code??c.code??c.id)===String(previousCountry));if(found){selectedCountry=String(previousCountry);$('#countrySelect').value=selectedCountry;renderCountryDropdown();await loadOffers();}}updateSummary();}));
async function loadOffers(){if(!selectedService||!selectedCountry)return;$('#offerList').innerHTML=`<div class="empty-state">${tr('Memuat penawaran...')}</div>`;try{const d=await api(`offers?service_id=${encodeURIComponent(selectedService.id)}&provider=${provider}&country_code=${encodeURIComponent(selectedCountry)}`);const data=Array.isArray(d.data)?d.data:(d.data?.data||[]);offers=data;renderOffers();}catch(e){offers=[];$('#offerList').innerHTML=`<div class="empty-state">${esc(e.message)}</div>`;}localize($('#offerList'));}
function renderOffers(){$('#offerList').innerHTML=offers.length?offers.map((o,i)=>`<label class="offer-row ${selectedOffer?.provider_id===o.provider_id?'selected':''}"><span><b>${esc(o.server_label||`Server ${i+1}`)} ${o.recommended?'<i class="fa-solid fa-star offer-recommended-icon" aria-label="Recommended"></i>':''}</b><small>${esc(o.provider_id||'')}</small></span><span class="offer-stock">${Number(o.stock||0)} stok</span><span class="offer-price">${money(o.price)}</span><input type="radio" name="offer" value="${i}" ${selectedOffer?.provider_id===o.provider_id?'checked':''} ${Number(o.stock||0)<=0?'disabled':''}></label>`).join(''):'<div class="empty-state">Tidak ada server tersedia untuk pilihan ini.</div>';
 $$('.offer-row').forEach((row,i)=>row.addEventListener('click',()=>{if(Number(offers[i].stock||0)<=0)return;selectedOffer=offers[i];renderOffers();updateSummary();}));localize($('#offerList'));}
function updateSummary(){const price=Number(selectedOffer?.price||0),balance=Number(profile?.balance||0);$('#orderTotal').textContent=money(price);$('#balanceAfter').textContent=money(balance-price);$('#buyButton').disabled=!(selectedService&&selectedCountry&&selectedOffer&&price>0);}
$('#buyButton').addEventListener('click',async()=>{if(!selectedOffer)return;const price=Number(selectedOffer.price);if(Number(profile?.balance||0)<price){await Swal.fire({icon:'warning',title:'Saldo Anda Kurang',text:'Silakan top up saldo terlebih dahulu untuk melanjutkan pembelian.',showCancelButton:true,confirmButtonText:'Topup sekarang',cancelButtonText:'Nanti'}).then(r=>{if(r.isConfirmed)setPage('topup');});return;}
 const confirm=await Swal.fire({title:'Konfirmasi pembelian',html:`<div style="text-align:left">${esc(selectedService.name)}<br>${esc(selectedOffer.server_label||provider)}<br><b>${money(price)}</b></div>`,showCancelButton:true,confirmButtonText:'Beli nomor',cancelButtonText:'Batal'});if(!confirm.isConfirmed)return;$('#buyButton').disabled=true;try{let result=await api('order',{method:'POST',body:JSON.stringify({service_id:selectedService.id,service_name:selectedService.name,provider,country_code:selectedCountry,provider_id:selectedOffer.provider_id,quoted_price:price})});await refreshProfile();updateSummary();await Swal.fire({icon:'success',title:'Nomor berhasil dipesan',html:`Order ID kamu:<br><b>${esc(result.custom_order_id||result.order?.custom_order_id||'')}</b><br><br>Nomor: ${esc(result.order?.phone||'Menunggu alokasi')}`,confirmButtonText:'Lihat riwayat'});setPage('history');}catch(e){if(e.status===402||e.message.includes('Saldo Anda Kurang')){await Swal.fire({icon:'warning',title:'Saldo Anda Kurang',text:'Saldo tidak cukup untuk pembelian ini.',showCancelButton:true,confirmButtonText:'Topup',cancelButtonText:'Tutup'}).then(r=>{if(r.isConfirmed)setPage('topup');});}else alertError(e.message);}finally{$('#buyButton').disabled=!(selectedOffer&&selectedService&&selectedCountry);}});

let pendingTopupRequestKey=sessionStorage.getItem('sora_topup_request_key')||null;
if(pendingTopupRequestKey){selectedAmount=Number(sessionStorage.getItem('sora_topup_amount')||0);$$('[data-amount]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.amount)===selectedAmount));$('#topupButton').disabled=!selectedAmount;}
$$('[data-amount]').forEach(b=>b.addEventListener('click',()=>{$$('[data-amount]').forEach(x=>x.classList.toggle('selected',x===b));const nextAmount=Number(b.dataset.amount);if(nextAmount!==selectedAmount){pendingTopupRequestKey=null;sessionStorage.removeItem('sora_topup_request_key');}selectedAmount=nextAmount;sessionStorage.setItem('sora_topup_amount',String(selectedAmount));$('#topupButton').disabled=false;}));
$('#topupButton').addEventListener('click',async()=>{if(!selectedAmount)return;$('#topupButton').disabled=true;try{if(!pendingTopupRequestKey){pendingTopupRequestKey=crypto.randomUUID();sessionStorage.setItem('sora_topup_request_key',pendingTopupRequestKey);sessionStorage.setItem('sora_topup_amount',String(selectedAmount));}let d=await api('create-payment',{method:'POST',headers:{'Idempotency-Key':pendingTopupRequestKey},body:JSON.stringify({amount:selectedAmount})});const p=d.payment||{};$('#paymentResult').classList.remove('hidden');const checkout=p.payment_link||'';$('#paymentResult').innerHTML=`<b>${d.already_paid?'Pembayaran sudah diterima':'Tagihan dibuat'} · ${money(selectedAmount)}</b><p>Ref: ${esc(d.merchant_ref_id||'')}</p><p>Batas bayar: ${esc(p.expired_at||'-')}</p>${p.qr_link?`<img src="${esc(p.qr_link)}" alt="QRIS" referrerpolicy="no-referrer" style="width:190px;max-width:100%;border-radius:12px;background:#fff;padding:8px">`:''}${checkout?`<a href="${esc(checkout)}" target="_blank" rel="noopener noreferrer">Buka halaman pembayaran <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`:''}<p class="tiny-note">Saldo hanya bertambah setelah webhook pembayaran SekaliPay terverifikasi.</p>`;if(checkout)window.open(checkout,'_blank','noopener,noreferrer');pendingTopupRequestKey=null;sessionStorage.removeItem('sora_topup_request_key');sessionStorage.removeItem('sora_topup_amount');}catch(e){alertError(e.message);}finally{$('#topupButton').disabled=!selectedAmount;}});

async function loadHistory(){try{const d=await api('history');renderHistory(d);}catch(e){$('#historyList').innerHTML=`<div class="loading-card glass">${esc(e.message)}</div>`;}}
function renderHistory(d){
 const rows=historyMode==='orders'?(d.orders||[]):(d.topups||[]);
 $('#historyList').innerHTML=rows.length?rows.map(r=>{
  const id=r.custom_order_id||r.merchant_ref_id;const name=r.service_name||'Top up saldo';const status=String(r.status||'pending');
  return `<div class="history-item"><div><b>${esc(id)}</b><small>${esc(name)} · ${new Date(r.created_at).toLocaleString(uiLang==='id'?'id-ID':deviceLocale)}</small><span class="status-pill ${status==='pending'||status==='awaiting_otp'?'pending':''}">${esc(status.replaceAll('_',' '))}</span></div><strong>${money(r.amount)}</strong></div>`;
 }).join(''):`<div class="loading-card glass">${tr('Belum ada transaksi.')}</div>`;
 localize($('#historyList'));
}
$$('[data-history]').forEach(b=>b.addEventListener('click',()=>{$$('[data-history]').forEach(x=>x.classList.toggle('active',x===b));historyMode=b.dataset.history;loadHistory();}));
init();
