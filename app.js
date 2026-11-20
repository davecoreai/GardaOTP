import { balanceDisplay } from './lib/balance-format.js';
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
    'Saldo setelah beli': 'Balance after purchase', 'Total harga': 'Total price', 'Beli nomor sekarang': 'Buy Number',
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
    'Beli nomor sekarang': 'Buy Number', 'Saldo setelah beli': 'Balance after purchase', 'Total harga': 'Total price',
    'Layanan sementara tidak tersedia. Coba lagi.': 'Service temporarily unavailable. Please try again.',
    'Belum ada data deposit.': 'No deposit data yet.', 'Belum ada transaksi.': 'No transactions yet.',
    'Memuat papan peringkat...': 'Loading leaderboard...', 'Memuat riwayat...': 'Loading history...', 'Pilih nominal':'Choose amount', 'Ringkasan pesanan':'Order summary', 'Metode pembayaran':'Payment method',
    'Peringkat pengguna': 'User leaderboard', 'PERINGKAT / PENGGUNA': 'RANK / USER', 'NILAI PESANAN': 'ORDER VALUE',
    'Pesanan seluruh pengguna': 'Orders across all users', 'SALDO SAAT INI': 'CURRENT BALANCE',
    'Edit nama': 'Edit name', 'Keluar akun': 'Sign out', 'AKUN AKTIF': 'ACCOUNT ACTIVE',
    'Verifikasi email': 'Verify email', 'Masukkan kode 6 digit yang dikirim ke email kamu.': 'Enter the 6-digit code sent to your email.',
    'MEMBALAS': 'REPLYING TO', 'Ruang komunitas': 'Community room', 'Menghubungkan...': 'Connecting...', 'Belum ada percakapan': 'No conversations yet', 'Jadilah orang pertama yang menyapa komunitas Garda OTP.': 'Be the first to say hello to the Garda OTP community.', 'Muat pesan sebelumnya': 'Load older messages', 'Membalas': 'Replying to', 'Tulis pesan untuk komunitas...': 'Write a message to the community...', 'Pesan dapat dilihat semua pengguna': 'Messages are visible to all users', 'Enter untuk kirim · Shift + Enter untuk baris baru': 'Enter to send · Shift + Enter for a new line',
    'Verifikasi akun': 'Verify account', 'Kirim ulang kode': 'Resend code', 'Pilih layanan terlebih dahulu': 'Choose a service first',
    'Harga dan stok mengikuti penawaran live provider. Harga dikunci saat konfirmasi.': 'Price and stock follow live provider offers. The price is checked again at confirmation.',
    'Selesaikan pembayaran pada halaman pembayaran yang dibuka. Saldo hanya bertambah setelah notifikasi pembayaran terverifikasi.': 'Complete payment on the opened payment page. Your balance is credited only after the payment notification is verified.',
    'Bayar langsung dengan dompet digital DANA': 'Pay directly with DANA digital wallet',
    'Scan dari bank atau e-wallet (GoPay, OVO, dll)': 'Scan from any bank or e-wallet (GoPay, OVO, etc.)',
        'Verifikasi digital,':'Digital verification,','lebih praktis.':'made simple.','Garda OTP menyediakan akses pemesanan nomor virtual untuk kebutuhan penerimaan kode verifikasi pada layanan yang tersedia. Pilih layanan, negara, dan penawaran server, lalu kelola pesanan dari satu dashboard.':'Garda OTP lets you order virtual numbers to receive verification codes on supported services. Choose a service, country, and server offer, then manage orders from one dashboard.',
    'Mulai sekarang':'Get started','Lihat cara penggunaan':'How it works','Ketersediaan nomor, harga, dan masa aktif mengikuti informasi yang diberikan provider saat pemesanan.':'Number availability, pricing, and validity depend on provider information at the time of order.',
    'Semua kebutuhan OTP dalam satu tempat.':'All your OTP needs in one place.','Kelola proses pemesanan dan transaksi dengan alur yang jelas, mulai dari memilih layanan sampai memeriksa status pesanan.':'Manage orders and transactions through a clear flow, from choosing a service to checking order status.',
    'Katalog layanan':'Service catalog','Temukan aplikasi dan platform yang tersedia dari katalog provider.':'Find available apps and platforms in the provider catalog.','Pilihan negara':'Country selection','Pilih negara berdasarkan ketersediaan untuk layanan yang dipilih.':'Choose a country based on availability for the selected service.',
    'Harga dan stok server':'Server prices and stock','Periksa harga dan stok dari penawaran server sebelum membeli.':'Check server prices and stock before purchasing.','Pembayaran QRIS':'QRIS payments','Buat tagihan top up dan scan QRIS yang diterbitkan untuk transaksi tersebut.':'Create a top-up invoice and scan the QRIS issued for that transaction.',
    'Riwayat transaksi':'Transaction history','Periksa referensi, nominal, dan status pembelian maupun top up.':'Check references, amounts, and purchase or top-up status.','Saldo akun':'Account balance','Pantau saldo akun dan gunakan untuk transaksi pembelian nomor.':'Monitor your balance and use it to purchase numbers.',
    'Alur penggunaan yang sederhana.':'A simple way to get started.','Setiap pembelian dilakukan melalui akun Garda OTP. Periksa detail pesanan sebelum mengonfirmasi transaksi.':'Every purchase is made through your Garda OTP account. Review order details before confirming.',
    'Daftar atau masuk':'Sign up or sign in','Buat akun menggunakan email, lalu masuk untuk membuka dashboard pribadi.':'Create an account with your email, then sign in to open your dashboard.','Pilih layanan dan negara':'Choose a service and country','Cari layanan tujuan, pilih negara, lalu lihat server yang tersedia.':'Find the service you need, choose a country, and view available servers.',
    'Periksa penawaran':'Review offers','Pastikan harga, stok, dan saldo sudah sesuai sebelum mengirim pesanan.':'Check the price, stock, and balance before placing an order.','Pantau pesanan':'Track your order','Lihat detail dan status pesanan melalui halaman riwayat akun.':'View order details and status in your account history.',
    'Pembayaran dan saldo':'Payments and balance','Top up dilakukan dengan membuat tagihan QRIS. Gunakan QRIS yang muncul pada tagihan aktif dan selesaikan pembayaran sebelum batas waktu berakhir. Saldo hanya diperbarui setelah pembayaran berhasil diverifikasi oleh sistem pembayaran.':'Top up by creating a QRIS invoice. Pay using the QRIS shown on the active invoice before it expires. Your balance is updated only after the payment provider verifies the payment.',
    'Informasi nomor virtual':'Virtual number information','Nomor virtual disediakan berdasarkan stok provider. Penerimaan kode OTP dapat dipengaruhi oleh kebijakan aplikasi tujuan, negara, dan kondisi nomor. Garda OTP tidak menjamin setiap nomor dapat digunakan pada seluruh layanan.':'Virtual numbers are supplied based on provider stock. OTP delivery may depend on the destination app, country, and number status. Garda OTP cannot guarantee that every number works with every service.',
    'Penggunaan yang bertanggung jawab':'Responsible use','Gunakan layanan sesuai hukum dan ketentuan platform tujuan. Jangan gunakan nomor untuk penipuan, spam, penyamaran identitas, atau aktivitas yang melanggar hak orang lain.':'Use the service lawfully and follow the destination platform rules. Do not use numbers for fraud, spam, impersonation, or activities that violate others’ rights.',
    'Pertanyaan yang sering diajukan.':'Frequently asked questions.','Apa itu Garda OTP?':'What is Garda OTP?','Apakah semua aplikasi dan negara tersedia?':'Are all apps and countries available?','Bagaimana cara mengisi saldo?':'How do I add balance?','Kapan saldo akan masuk?':'When will my balance be credited?','Apakah nomor pasti menerima OTP?':'Will the number definitely receive an OTP?','Di mana saya melihat status pesanan?':'Where can I check my order status?',
    'Mulai gunakan Garda OTP.':'Start using Garda OTP.','Buat akun untuk melihat katalog, penawaran server, dan transaksi dari dashboard.':'Create an account to view the catalog, server offers, and transactions from your dashboard.','Masuk ke Garda OTP':'Open Garda OTP','Nomor virtual dan layanan verifikasi.':'Virtual numbers and verification services.','Seluruh hak cipta dilindungi.':'All rights reserved.',
    'Masuk ke akun':'Sign in to your account','Masuk untuk melanjutkan ke dashboard Garda OTP.':'Sign in to continue to your Garda OTP dashboard.','Buat akun':'Create account','Lengkapi data berikut untuk membuat akun Garda OTP.':'Complete the details below to create your Garda OTP account.','Login Dengan Google':'Continue with Google','atau dengan email':'or continue with email','Nama':'Name','Nama lengkap':'Full name','Minimal 8 karakter':'At least 8 characters','Belum punya akun? Daftar':'New here? Sign up','Sudah punya akun? Masuk':'Already have an account? Sign in',
    'Beli':'Buy','nomor.':'number.','transaksi.':'history.','Top up':'Top up','stok':'stock','tersedia':'available','LANGKAH 01':'STEP 01','LANGKAH 02':'STEP 02','LANGKAH 03':'STEP 03','LANGSUNG':'LIVE','AKTIF':'ACTIVE'
  },
  id: {
    'TOTAL BALANCE':'TOTAL SALDO','GLOBAL ORDERS':'TOTAL PESANAN','TODAY':'HARI INI','AVAILABLE BALANCE':'SALDO TERSEDIA',
    'STEP 01':'LANGKAH 01','STEP 02':'LANGKAH 02','STEP 03':'LANGKAH 03','LIVE CATALOG':'KATALOG AKTIF','LIVE PRICE & STOCK':'HARGA & STOK LIVE',
    'ORDER SUMMARY':'RINGKASAN PESANAN','YOUR OTP CODE':'KODE OTP ANDA','RANK / USER':'PERINGKAT / PENGGUNA',
    'TOTAL ORDER VALUE':'NILAI TOTAL PESANAN','GLOBAL RANKING':'PERINGKAT GLOBAL','Garda OTP — Verification, Simplified':'Garda OTP — Verifikasi Lebih Praktis',
    'Verification, simplified.':'Verifikasi lebih praktis.','All your OTP needs in one place.':'Semua kebutuhan OTP dalam satu tempat.',
    'Popular services':'Layanan populer','Choose a country':'Pilih negara','Server options':'Pilihan server','CURRENT BALANCE':'SALDO SAAT INI',
    'EMAIL VERIFICATION':'VERIFIKASI EMAIL','YOUR VERIFICATION CODE':'KODE VERIFIKASI ANDA','ACCOUNT SECURITY':'KEAMANAN AKUN',
    'COPY CODE':'SALIN KODE','SECURITY NOTICE':'INFORMASI KEAMANAN','PROFILE':'PROFIL','HOME':'BERANDA','BUY':'BELI',
    'HISTORY':'RIWAYAT','SIGN OUT':'KELUAR','AVAILABLE':'TERSEDIA','available':'tersedia','Pilih server':'Choose a server','Total harga':'Total price','Saldo akun':'Account balance','Beli nomor sekarang':'Buy Number','Lanjutkan pembayaran':'Continue to payment','Pembelian nomor':'Number purchases','Top up saldo':'Add balance','Menunggu alokasi':'Awaiting allocation','Tidak ada server tersedia untuk pilihan ini.':'No servers available for this selection.','TOTAL DEPOSIT':'TOTAL DEPOSIT','Beli':'Buy','nomor.':'number.','transaksi.':'history.','stok':'stock','LANGSUNG':'LIVE',
    'VERIFIKASI DIGITAL':'DIGITAL VERIFICATION','BERANDA':'HOME','PILIH LAYANAN':'CHOOSE A SERVICE'
  }
};
Object.assign(translations.en,{
 'Kelola identitas dan tampilan akun Garda OTP kamu.':'Manage your Garda OTP account identity and appearance.',
 'Atur nama tampilan, foto profil, dan banner akun.':'Customize your display name, profile photo, and account banner.',
 'AKUN AKTIF':'ACCOUNT ACTIVE','Edit Profile':'Edit Profile','Nama tampilan':'Display name',
 'Username akun':'Account username','Username tidak dapat diubah dari halaman ini.':'Your username cannot be changed here.',
 'Foto profil':'Profile photo','Banner profil':'Profile banner','Pilih foto':'Choose photo','Pilih banner':'Choose banner',
 'Batal':'Cancel','Simpan perubahan':'Save changes','Nama yang ditampilkan':'Displayed name',
 'Nama tampilan tidak mengubah username login kamu.':'Your display name does not change your login username.',
 'Profile diperbarui':'Profile updated','Perubahan nama, username, foto profil, dan banner sudah disimpan.':'Your name, profile photo, and banner have been saved.',
 'Username belum diatur':'Username not set','PREVIEW BANNER':'BANNER PREVIEW'
});
const tr = value => (translations[uiLang] || {})[value] || value;
function localize(root=document){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{const raw=node.nodeValue;const trimmed=raw.trim();if(!trimmed)return;const translated=tr(trimmed);if(translated!==trimmed)node.nodeValue=raw.replace(trimmed,translated);});
  root.querySelectorAll?.('[placeholder],[aria-label],[title]').forEach(el=>['placeholder','aria-label','title'].forEach(attr=>{const v=el.getAttribute(attr);if(v)el.setAttribute(attr,tr(v));}));
}
function serviceDisplayName(name=''){
 return String(name).replace(/\s*(?:[-–—|:]\s*)?Indonesia\s*$/i,'').trim();
}
const serviceLogoRules=[
 [/whatsapp|\bwa\b/i,'whatsapp.png'],[/telegram/i,'logo-02.png'],[/google|gmail/i,'logo-04.png'],[/facebook/i,'logo-05.png'],[/adidas/i,'logo-06.png'],[/airbnb/i,'logo-07.png'],[/alibaba/i,'logo-08.png'],[/alfagift/i,'logo-09.png'],[/aliexpress/i,'logo-10.png'],[/akulaku/i,'logo-11.png'],[/alipay/i,'logo-12.png'],[/amazon/i,'logo-13.png'],[/bereal/i,'logo-15.png'],[/blibli/i,'logo-16.png'],[/blizzard/i,'logo-17.png'],[/bolt/i,'logo-18.png'],[/badoo/i,'logo-19.png'],[/bumble/i,'logo-20.png'],[/openai|chatgpt/i,'logo-21.png'],[/dana/i,'logo-22.png'],[/claude/i,'logo-23.png'],[/carousell/i,'logo-24.png'],[/hago/i,'logo-25.png'],[/discord/i,'logo-28.png'],[/tiktok/i,'logo-29.png'],[/shopee/i,'logo-30.png'],[/snapchat/i,'logo-31.png'],[/depop/i,'logo-27.png']
];
function serviceLogoFile(name=''){return serviceLogoRules.find(([pattern])=>pattern.test(String(name)))?.[1]||null;}
const countryIsoByName=Object.fromEntries([["aruba","AW"],["afghanistan","AF"],["islamic republic of afghanistan","AF"],["angola","AO"],["republic of angola","AO"],["anguilla","AI"],["aland islands","AX"],["albania","AL"],["republic of albania","AL"],["andorra","AD"],["principality of andorra","AD"],["united arab emirates","AE"],["argentina","AR"],["argentine republic","AR"],["armenia","AM"],["republic of armenia","AM"],["american samoa","AS"],["antarctica","AQ"],["french southern territories","TF"],["antigua and barbuda","AG"],["australia","AU"],["austria","AT"],["republic of austria","AT"],["azerbaijan","AZ"],["republic of azerbaijan","AZ"],["burundi","BI"],["republic of burundi","BI"],["belgium","BE"],["kingdom of belgium","BE"],["benin","BJ"],["republic of benin","BJ"],["bonaire sint eustatius and saba","BQ"],["burkina faso","BF"],["bangladesh","BD"],["people s republic of bangladesh","BD"],["bulgaria","BG"],["republic of bulgaria","BG"],["bahrain","BH"],["kingdom of bahrain","BH"],["bahamas","BS"],["commonwealth of the bahamas","BS"],["bosnia and herzegovina","BA"],["republic of bosnia and herzegovina","BA"],["saint barthelemy","BL"],["belarus","BY"],["republic of belarus","BY"],["belize","BZ"],["bermuda","BM"],["bolivia plurinational state of","BO"],["plurinational state of bolivia","BO"],["bolivia","BO"],["brazil","BR"],["federative republic of brazil","BR"],["barbados","BB"],["brunei darussalam","BN"],["bhutan","BT"],["kingdom of bhutan","BT"],["bouvet island","BV"],["botswana","BW"],["republic of botswana","BW"],["central african republic","CF"],["canada","CA"],["cocos keeling islands","CC"],["switzerland","CH"],["swiss confederation","CH"],["chile","CL"],["republic of chile","CL"],["china","CN"],["people s republic of china","CN"],["cote d ivoire","CI"],["republic of cote d ivoire","CI"],["cameroon","CM"],["republic of cameroon","CM"],["congo the democratic republic of the","CD"],["congo","CG"],["republic of the congo","CG"],["cook islands","CK"],["colombia","CO"],["republic of colombia","CO"],["comoros","KM"],["union of the comoros","KM"],["cabo verde","CV"],["republic of cabo verde","CV"],["costa rica","CR"],["republic of costa rica","CR"],["cuba","CU"],["republic of cuba","CU"],["curacao","CW"],["christmas island","CX"],["cayman islands","KY"],["cyprus","CY"],["republic of cyprus","CY"],["czechia","CZ"],["czech republic","CZ"],["germany","DE"],["federal republic of germany","DE"],["djibouti","DJ"],["republic of djibouti","DJ"],["dominica","DM"],["commonwealth of dominica","DM"],["denmark","DK"],["kingdom of denmark","DK"],["dominican republic","DO"],["algeria","DZ"],["people s democratic republic of algeria","DZ"],["ecuador","EC"],["republic of ecuador","EC"],["egypt","EG"],["arab republic of egypt","EG"],["eritrea","ER"],["the state of eritrea","ER"],["western sahara","EH"],["spain","ES"],["kingdom of spain","ES"],["estonia","EE"],["republic of estonia","EE"],["ethiopia","ET"],["federal democratic republic of ethiopia","ET"],["finland","FI"],["republic of finland","FI"],["fiji","FJ"],["republic of fiji","FJ"],["falkland islands malvinas","FK"],["france","FR"],["french republic","FR"],["faroe islands","FO"],["micronesia federated states of","FM"],["federated states of micronesia","FM"],["gabon","GA"],["gabonese republic","GA"],["united kingdom","GB"],["united kingdom of great britain and northern ireland","GB"],["georgia","GE"],["guernsey","GG"],["ghana","GH"],["republic of ghana","GH"],["gibraltar","GI"],["guinea","GN"],["republic of guinea","GN"],["guadeloupe","GP"],["gambia","GM"],["republic of the gambia","GM"],["guinea bissau","GW"],["republic of guinea bissau","GW"],["equatorial guinea","GQ"],["republic of equatorial guinea","GQ"],["greece","GR"],["hellenic republic","GR"],["grenada","GD"],["greenland","GL"],["guatemala","GT"],["republic of guatemala","GT"],["french guiana","GF"],["guam","GU"],["guyana","GY"],["republic of guyana","GY"],["hong kong","HK"],["hong kong special administrative region of china","HK"],["heard island and mcdonald islands","HM"],["honduras","HN"],["republic of honduras","HN"],["croatia","HR"],["republic of croatia","HR"],["haiti","HT"],["republic of haiti","HT"],["hungary","HU"],["indonesia","ID"],["republic of indonesia","ID"],["isle of man","IM"],["india","IN"],["republic of india","IN"],["british indian ocean territory","IO"],["ireland","IE"],["iran islamic republic of","IR"],["islamic republic of iran","IR"],["iran","IR"],["iraq","IQ"],["republic of iraq","IQ"],["iceland","IS"],["republic of iceland","IS"],["israel","IL"],["state of israel","IL"],["italy","IT"],["italian republic","IT"],["jamaica","JM"],["jersey","JE"],["jordan","JO"],["hashemite kingdom of jordan","JO"],["japan","JP"],["kazakhstan","KZ"],["republic of kazakhstan","KZ"],["kenya","KE"],["republic of kenya","KE"],["kyrgyzstan","KG"],["kyrgyz republic","KG"],["cambodia","KH"],["kingdom of cambodia","KH"],["kiribati","KI"],["republic of kiribati","KI"],["saint kitts and nevis","KN"],["korea republic of","KR"],["south korea","KR"],["kuwait","KW"],["state of kuwait","KW"],["lao people s democratic republic","LA"],["laos","LA"],["lebanon","LB"],["lebanese republic","LB"],["liberia","LR"],["republic of liberia","LR"],["libya","LY"],["saint lucia","LC"],["liechtenstein","LI"],["principality of liechtenstein","LI"],["sri lanka","LK"],["democratic socialist republic of sri lanka","LK"],["lesotho","LS"],["kingdom of lesotho","LS"],["lithuania","LT"],["republic of lithuania","LT"],["luxembourg","LU"],["grand duchy of luxembourg","LU"],["latvia","LV"],["republic of latvia","LV"],["macao","MO"],["macao special administrative region of china","MO"],["saint martin french part","MF"],["morocco","MA"],["kingdom of morocco","MA"],["monaco","MC"],["principality of monaco","MC"],["moldova republic of","MD"],["republic of moldova","MD"],["moldova","MD"],["madagascar","MG"],["republic of madagascar","MG"],["maldives","MV"],["republic of maldives","MV"],["mexico","MX"],["united mexican states","MX"],["marshall islands","MH"],["republic of the marshall islands","MH"],["north macedonia","MK"],["republic of north macedonia","MK"],["mali","ML"],["republic of mali","ML"],["malta","MT"],["republic of malta","MT"],["myanmar","MM"],["republic of myanmar","MM"],["montenegro","ME"],["mongolia","MN"],["northern mariana islands","MP"],["commonwealth of the northern mariana islands","MP"],["mozambique","MZ"],["republic of mozambique","MZ"],["mauritania","MR"],["islamic republic of mauritania","MR"],["montserrat","MS"],["martinique","MQ"],["mauritius","MU"],["republic of mauritius","MU"],["malawi","MW"],["republic of malawi","MW"],["malaysia","MY"],["mayotte","YT"],["namibia","NA"],["republic of namibia","NA"],["new caledonia","NC"],["niger","NE"],["republic of the niger","NE"],["norfolk island","NF"],["nigeria","NG"],["federal republic of nigeria","NG"],["nicaragua","NI"],["republic of nicaragua","NI"],["niue","NU"],["netherlands","NL"],["kingdom of the netherlands","NL"],["norway","NO"],["kingdom of norway","NO"],["nepal","NP"],["federal democratic republic of nepal","NP"],["nauru","NR"],["republic of nauru","NR"],["new zealand","NZ"],["oman","OM"],["sultanate of oman","OM"],["pakistan","PK"],["islamic republic of pakistan","PK"],["panama","PA"],["republic of panama","PA"],["pitcairn","PN"],["peru","PE"],["republic of peru","PE"],["philippines","PH"],["republic of the philippines","PH"],["palau","PW"],["republic of palau","PW"],["papua new guinea","PG"],["independent state of papua new guinea","PG"],["poland","PL"],["republic of poland","PL"],["puerto rico","PR"],["korea democratic people s republic of","KP"],["democratic people s republic of korea","KP"],["north korea","KP"],["portugal","PT"],["portuguese republic","PT"],["paraguay","PY"],["republic of paraguay","PY"],["palestine state of","PS"],["the state of palestine","PS"],["french polynesia","PF"],["qatar","QA"],["state of qatar","QA"],["reunion","RE"],["romania","RO"],["russian federation","RU"],["rwanda","RW"],["rwandese republic","RW"],["saudi arabia","SA"],["kingdom of saudi arabia","SA"],["sudan","SD"],["republic of the sudan","SD"],["senegal","SN"],["republic of senegal","SN"],["singapore","SG"],["republic of singapore","SG"],["south georgia and the south sandwich islands","GS"],["saint helena ascension and tristan da cunha","SH"],["svalbard and jan mayen","SJ"],["solomon islands","SB"],["sierra leone","SL"],["republic of sierra leone","SL"],["el salvador","SV"],["republic of el salvador","SV"],["san marino","SM"],["republic of san marino","SM"],["somalia","SO"],["federal republic of somalia","SO"],["saint pierre and miquelon","PM"],["serbia","RS"],["republic of serbia","RS"],["south sudan","SS"],["republic of south sudan","SS"],["sao tome and principe","ST"],["democratic republic of sao tome and principe","ST"],["suriname","SR"],["republic of suriname","SR"],["slovakia","SK"],["slovak republic","SK"],["slovenia","SI"],["republic of slovenia","SI"],["sweden","SE"],["kingdom of sweden","SE"],["eswatini","SZ"],["kingdom of eswatini","SZ"],["sint maarten dutch part","SX"],["seychelles","SC"],["republic of seychelles","SC"],["syrian arab republic","SY"],["syria","SY"],["turks and caicos islands","TC"],["chad","TD"],["republic of chad","TD"],["togo","TG"],["togolese republic","TG"],["thailand","TH"],["kingdom of thailand","TH"],["tajikistan","TJ"],["republic of tajikistan","TJ"],["tokelau","TK"],["turkmenistan","TM"],["timor leste","TL"],["democratic republic of timor leste","TL"],["tonga","TO"],["kingdom of tonga","TO"],["trinidad and tobago","TT"],["republic of trinidad and tobago","TT"],["tunisia","TN"],["republic of tunisia","TN"],["turkiye","TR"],["republic of turkiye","TR"],["tuvalu","TV"],["taiwan province of china","TW"],["taiwan","TW"],["tanzania united republic of","TZ"],["united republic of tanzania","TZ"],["tanzania","TZ"],["uganda","UG"],["republic of uganda","UG"],["ukraine","UA"],["united states minor outlying islands","UM"],["uruguay","UY"],["eastern republic of uruguay","UY"],["united states","US"],["united states of america","US"],["uzbekistan","UZ"],["republic of uzbekistan","UZ"],["holy see vatican city state","VA"],["saint vincent and the grenadines","VC"],["venezuela bolivarian republic of","VE"],["bolivarian republic of venezuela","VE"],["venezuela","VE"],["virgin islands british","VG"],["british virgin islands","VG"],["virgin islands u s","VI"],["virgin islands of the united states","VI"],["viet nam","VN"],["socialist republic of viet nam","VN"],["vietnam","VN"],["vanuatu","VU"],["republic of vanuatu","VU"],["wallis and futuna","WF"],["samoa","WS"],["independent state of samoa","WS"],["yemen","YE"],["republic of yemen","YE"],["south africa","ZA"],["republic of south africa","ZA"],["zambia","ZM"],["republic of zambia","ZM"],["zimbabwe","ZW"],["republic of zimbabwe","ZW"],["usa","US"],["us","US"],["uk","GB"],["great britain","GB"],["england","GB"],["russia","RU"],["korea","KR"],["republic of korea","KR"],["holland","NL"],["uae","AE"],["turkey","TR"],["burma","MM"],["ivory coast","CI"],["cape verde","CV"],["swaziland","SZ"],["macedonia","MK"],["brunei","BN"],["east timor","TL"],["palestine","PS"],["kosovo","XK"]]);
function normalizeCountryName(name=''){
 return String(name).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function countryIsoCode(country={}){
 const raw=String(country.iso2??country.iso_code??country.alpha2??country.country_iso??country.country_code??country.code??'').trim();
 if(/^[a-z]{2}$/i.test(raw))return raw.toUpperCase();
 const rawName=String(country.name??country.country_name??country.title??'');
 const normalized=normalizeCountryName(rawName);
 const withoutDialCode=normalized.replace(/\b\d{1,4}\b/g,' ').replace(/\s+/g,' ').trim();
 return countryIsoByName[normalized]||countryIsoByName[withoutDialCode]||'';
}
function countryFlag(country={}){
 const explicit=country.flag_emoji??country.emoji??country.flag;
 if(typeof explicit==='string' && /[\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(explicit))return explicit;
 const raw=String(country.iso2??country.iso_code??country.alpha2??country.country_code??country.code??'').trim();
 let iso=/^[a-z]{2}$/i.test(raw)?raw.toUpperCase():'';
 if(!iso)iso=countryIsoByName[normalizeCountryName(country.name??country.country_name??country.title??'')]||'';
 if(!iso)return '🌐';
 return String.fromCodePoint(...[...iso].map(ch=>127397+ch.charCodeAt(0)));
}
function selectedCountryInfo(){
  const item=countries.find(c=>String(c.country_code??c.code??c.id??'')===String(selectedCountry??''));
  return item?{code:String(item.country_code??item.code??item.id??''),name:String(item.name??item.country_name??item.title??''),iso:countryIsoCode(item)}:null;
}
let sb=null, session=null, profile=null, services=[], popularServices=[], popularCountById=new Map(), selectedService=null, countries=[], selectedCountry=null, offers=[], selectedOffer=null, provider='provider_1', selectedAmount=0, historyMode='orders';
let leaderboardChannel=null, leaderboardFallback=null, liveRefreshQueued=false;
let currentOrderId=sessionStorage.getItem('sora_active_order_id')||null, otpPollTimer=null, otpPollInFlight=false, currentOrderCreatedAt=Date.now();
let activeTopupPayment=null, qrisPollTimer=null, qrisPollInFlight=false, notifiedPaidTopupRef=null;
try{const savedTopup=sessionStorage.getItem('sora_active_topup');if(savedTopup)activeTopupPayment=JSON.parse(savedTopup);}catch{}
const DASHBOARD_PAGE_KEY='sora_dashboard_page_v1';
const validDashboardPages=new Set(['home','buy','topup','qris','history','profile','edit-profile','otp']);
let showAllServices=false,showAllOffers=false,catalogLoaded=false,bootstrapPromise=null,countryLoadGeneration=0,offersLoadGeneration=0;
let balanceHidden=false;
try{balanceHidden=localStorage.getItem('garda_balance_hidden_v1')==='1';}catch{}
const countryCacheMemory=new Map();
const COUNTRY_CACHE_TTL=10*60*1000;
function getSavedDashboardPage(){try{const value=localStorage.getItem(DASHBOARD_PAGE_KEY);return validDashboardPages.has(value)?value:'home';}catch{return 'home';}}

async function api(path, opts={}) { const token=session?.access_token; const res=await fetch(`/api/${path}`,{...opts,headers:{...(opts.body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`} : {}),...(opts.headers||{})}}); const data=await res.json().catch(()=>({})); if(!res.ok) throw Object.assign(new Error(data.error||`Request gagal (${res.status})`),{status:res.status,data}); return data; }
function alertError(message){Swal.fire({icon:'error',title:'Terjadi kendala',text:message,confirmButtonText:'Mengerti'});}
function renderBalanceDisplays(){
 // Keep the currency prefix visible; conceal only the numeric amount.
 const display=balanceDisplay(profile?.balance||0,balanceHidden);
 const home=$('#homeBalance'),topup=$('#topupBalance');
 [home,topup].filter(Boolean).forEach(node=>{
  node.replaceChildren();
  const currency=document.createElement('span');currency.className='balance-currency';currency.textContent=display.currency;
  const amount=document.createElement('span');amount.className='balance-amount';amount.textContent=display.amount;amount.classList.toggle('is-obscured',balanceHidden);
  node.append(currency,document.createTextNode(' '),amount);
  node.setAttribute('aria-label',display.ariaLabel);
 });
 const label=balanceHidden?'Tampilkan saldo':'Sembunyikan saldo';
 $$('[data-balance-visibility]').forEach(button=>{
  button.setAttribute('aria-label',label);button.setAttribute('title',label);button.setAttribute('aria-pressed',String(balanceHidden));
  if(!button.classList.contains('is-sweeping'))button.innerHTML=`<i class="fa-regular ${balanceHidden?'fa-eye-slash':'fa-eye'}" aria-hidden="true"></i>`;
 });
}
let balanceToggleInFlight=false;
$$('[data-balance-visibility]').forEach(button=>button.addEventListener('click',()=>{
 if(balanceToggleInFlight)return;
 balanceToggleInFlight=true;
 const readout=button.closest('.balance-readout,.topup-balance-readout');
 const amountWidth=readout?.querySelector('.balance-amount')?.getBoundingClientRect().width||0;
 const travel=amountWidth+11;
 button.style.setProperty('--balance-sweep-distance',`-${travel}px`);
 button.classList.remove('is-sweeping');void button.offsetWidth;button.classList.add('is-sweeping');
 let finished=false;
 const finish=()=>{
  if(finished)return;finished=true;balanceToggleInFlight=false;button.classList.remove('is-sweeping');
  balanceHidden=!balanceHidden;
  try{localStorage.setItem('garda_balance_hidden_v1',balanceHidden?'1':'0');}catch{}
  renderBalanceDisplays();button.style.removeProperty('--balance-sweep-distance');
 };
 button.addEventListener('animationend',finish,{once:true});
 window.setTimeout(finish,560);
}));

function showLanding(){
 resetGoogleLoginButton();
 if(session?.access_token){showApp();if(!$('.page.active'))setPage(getSavedDashboardPage());return;}
 $('#app').classList.add('hidden');$('#authScreen').classList.add('hidden');$('#landingScreen').classList.remove('hidden');
 window.scrollTo({top:0,behavior:'smooth'});
}
function showAuth(){
 resetGoogleLoginButton();
 if(session?.access_token){showApp();if(!$('.page.active'))setPage(getSavedDashboardPage());return;}
 $('#landingScreen').classList.add('hidden');$('#app').classList.add('hidden');$('#authScreen').classList.remove('hidden');
 window.scrollTo({top:0,behavior:'smooth'});
}
function showApp(){
 $('#landingScreen').classList.add('hidden');$('#authScreen').classList.add('hidden');$('#app').classList.remove('hidden');
}
function setPage(name){
 if(session?.access_token&&validDashboardPages.has(name)){try{localStorage.setItem(DASHBOARD_PAGE_KEY,name);}catch{}}
 if(otpPollTimer){clearTimeout(otpPollTimer);otpPollTimer=null;}
 if(qrisPollTimer){clearTimeout(qrisPollTimer);qrisPollTimer=null;}
 $$('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${name}`));
 const navName=name==='otp'?'buy':name==='qris'?'topup':name==='edit-profile'?'profile':name;
 const navPages=['home','buy','topup','history','profile'];
 $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===navName));
 const idx=navPages.indexOf(navName);const indicator=$('.nav-indicator');
 if(indicator)indicator.style.transform=`translateX(${Math.max(0,idx)*100}%)`;
 if(name==='buy')loadCatalog();if(name==='history')loadHistory();if(name==='home')loadDashboard();
 if(name==='profile')renderProfile();if(name==='edit-profile')populateProfileEditor();if(name==='topup')refreshProfile();
 if(name==='qris')loadCurrentTopup();
 if(name==='otp')loadCurrentOrder();else if(currentOrderId&&session?.access_token)scheduleOtpPoll({next_check_after_seconds:15});
 const activePage=document.querySelector(`#page-${name}`);if(activePage)localize(activePage);window.scrollTo({top:0,behavior:'smooth'});
}
$$('[data-page]').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.page)));
(function enableDraggableTabPill(){
 const nav=$('.bottom-nav'),pill=$('.nav-indicator');
 if(!nav||!pill)return;
 const pages=['home','buy','topup','history','profile'];
 let drag=null;
 pill.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'&&event.button!==0)return;
  const navRect=nav.getBoundingClientRect(),pillRect=pill.getBoundingClientRect();
  const activeIndex=Math.max(0,pages.indexOf($('.nav-item.active')?.dataset.page||'home'));
  drag={pointerId:event.pointerId,startX:event.clientX,navRect,width:pillRect.width,left:pillRect.left-navRect.left,activeIndex,moved:false};
  pill.classList.add('is-dragging');pill.style.transition='none';pill.style.transform='none';pill.style.left=`${drag.left}px`;
  try{pill.setPointerCapture(event.pointerId);}catch{}
  event.preventDefault();
 });
 pill.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.pointerId)return;
  const maxLeft=Math.max(8,drag.navRect.width-drag.width-8);
  const nextLeft=Math.max(8,Math.min(maxLeft,drag.left+(event.clientX-drag.startX)));
  if(Math.abs(event.clientX-drag.startX)>5)drag.moved=true;
  pill.style.left=`${nextLeft}px`;
 });
 const finishDrag=event=>{
  if(!drag||event.pointerId!==drag.pointerId)return;
  const navRect=drag.navRect,pillRect=pill.getBoundingClientRect();
  const center=(pillRect.left-navRect.left)+(pillRect.width/2);
  const items=$$('.nav-item',nav);
  let nearest=0,best=Infinity;
  items.forEach((item,index)=>{const rect=item.getBoundingClientRect(),distance=Math.abs(center-(rect.left-navRect.left+rect.width/2));if(distance<best){best=distance;nearest=index;}});
  const shouldNavigate=drag.moved;
  drag=null;
  pill.classList.remove('is-dragging');pill.style.left='8px';pill.style.transition='';pill.style.transform=`translateX(${nearest*100}%)`;
  try{pill.releasePointerCapture(event.pointerId);}catch{}
  if(shouldNavigate&&pages[nearest])setPage(pages[nearest]);
 };
 pill.addEventListener('pointerup',finishDrag);
 pill.addEventListener('pointercancel',finishDrag);
})();
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.go)));
$('#headerAvatar').addEventListener('click',()=>{const menu=$('#headerMenu');const opening=menu.classList.contains('hidden');menu.classList.toggle('hidden',!opening);$('#headerAvatar').setAttribute('aria-expanded',String(opening));});
function closeHeaderMenu(){const menu=$('#headerMenu');menu?.classList.add('hidden');$('#headerAvatar')?.setAttribute('aria-expanded','false');}
$('#headerSettings').addEventListener('click',()=>{closeHeaderMenu();setPage('edit-profile');});
document.addEventListener('click',e=>{if(!e.target.closest('.header-menu-wrap'))closeHeaderMenu();});
async function init(){
 resetGoogleLoginButton();
 let authInitializationError=null;
 try {
  const response=await fetch('/api/public-config',{cache:'no-store'});
  const rawText=await response.text();
  let cfg={};
  try{cfg=rawText?JSON.parse(rawText):{};}catch{throw new Error(`Respons konfigurasi Supabase tidak valid (${response.status}).`);}
  if(!response.ok)throw new Error(cfg.error||`Konfigurasi Supabase gagal dimuat (${response.status}). Periksa Environment Variables server.`);
  if(!cfg.supabaseUrl||!cfg.supabaseAnonKey||!window.supabase)throw new Error('Konfigurasi Supabase tidak lengkap atau library Supabase belum termuat.');
  sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce',storage:window.localStorage}});
  const {data,error}=await sb.auth.getSession();
  if(error)throw error;
  session=data.session;
  sb.auth.onAuthStateChange((event,s)=>{
   session=s;
   if(s){showApp();if(event==='SIGNED_IN')bootstrapAndRestorePage();}
   else if(event==='SIGNED_OUT'){resetSessionState();showLanding();}
  });
 } catch(e){authInitializationError=e;console.warn('Supabase initialization paused:',e?.message||e);}
 if(session?.access_token){
  showApp();await bootstrap();
  const returnedTopup=new URLSearchParams(location.search).get('topup');
  if(returnedTopup){setPage('topup');await handleTopupReturn(returnedTopup);}
  else if(currentOrderId){setPage('otp');await refreshCurrentOrder(true);}
  else setPage(getSavedDashboardPage());
 } else {
  if(!authInitializationError && (location.pathname==='/login'||location.pathname==='/app')){
   showAuth();
  } else {
   showLanding();
  }
 }
 const todayLabel=$('#todayLabel');if(todayLabel)todayLabel.textContent=new Intl.DateTimeFormat(dateLocale,{weekday:'short',day:'2-digit',month:'short'}).format(new Date()).toUpperCase();
 document.documentElement.lang=uiLang;document.documentElement.setAttribute('translate','yes');localize(document.body);
}
let googleOAuthInFlight=false;
function resetGoogleLoginButton(){googleOAuthInFlight=false;const button=$('#googleLogin');if(button){button.disabled=false;button.removeAttribute('aria-busy');button.classList.remove('is-loading');}}
window.addEventListener('pageshow',resetGoogleLoginButton);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')resetGoogleLoginButton();});
$('#googleLogin').addEventListener('click',async()=>{
 if(!sb)return alertError('Supabase belum terhubung. Periksa /api/public-config dan Environment Variables Vercel.');
 if(googleOAuthInFlight)return;
 const button=$('#googleLogin');googleOAuthInFlight=true;button.disabled=true;button.setAttribute('aria-busy','true');button.classList.add('is-loading');
 try{
  const redirectTo=new URL('/',window.location.origin).toString();
  const {data,error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo,queryParams:{prompt:'select_account'}}});
  if(error)throw error;
  if(!data?.url)resetGoogleLoginButton();
 }catch(error){console.error('Google OAuth error:',error);alertError(error.message||'Login Google gagal dimulai. Periksa konfigurasi OAuth Supabase.');resetGoogleLoginButton();}
});

let registering=false, pendingEmail='', pendingPassword='', pendingUsername='', pendingName='';
function setAuthMode(isRegister){registering=isRegister;$('#authTitle').textContent=isRegister?'Buat akun':'Masuk ke akun';$('#authSubtitle').textContent=isRegister?'Lengkapi data berikut untuk membuat akun Garda OTP.':'Masuk untuk melanjutkan ke dashboard Garda OTP.';$('#nameField').classList.toggle('hidden',!isRegister);$('#usernameField').classList.toggle('hidden',!isRegister);$('#authName').required=isRegister;$('#authUsername').required=isRegister;$('#authPassword').autocomplete=isRegister?'new-password':'current-password';$('#passwordMeter').classList.toggle('hidden',!isRegister);$('#authSubmit').textContent=isRegister?'Buat akun':'Masuk';$('#authToggle').textContent=isRegister?'Sudah punya akun? Masuk':'Belum punya akun? Daftar';$('#emailOtpPanel').classList.add('hidden');$('#authForm').classList.remove('hidden');$('#googleLogin').classList.toggle('hidden',isRegister);}
$('#authToggle').addEventListener('click',()=>{setAuthMode(!registering);localize($('#authScreen'));});
const openLandingAuth=()=>{setAuthMode(false);showAuth();};
['landingLogin','landingLoginMobile','landingStart','landingBottomStart'].forEach(id=>document.getElementById(id)?.addEventListener('click',openLandingAuth));
$('#authBack')?.addEventListener('click',showLanding);
$('#authPassword').addEventListener('input',()=>{const v=$('#authPassword').value;let score=0;if(v.length>=8)score++;if(/[a-z]/.test(v)&&/[A-Z]/.test(v))score++;if(/\d/.test(v))score++;if(/[^A-Za-z0-9]/.test(v))score++;$('#passwordStrength').style.width=(score*25)+'%';$('#passwordStrength').dataset.level=String(score);$('#passwordHint').textContent=(uiLang==='id'?['Sangat lemah','Lemah','Cukup','Kuat','Sangat kuat']:['Very weak','Weak','Fair','Strong','Very strong'])[score];});
function restrictUsername(input){if(!input)return;input.addEventListener('beforeinput',e=>{if(e.data&&/[^a-z0-9]/.test(e.data))e.preventDefault();});input.addEventListener('input',()=>{const clean=input.value.replace(/[^a-z0-9]/g,'').slice(0,20);if(input.value!==clean)input.value=clean;});}
restrictUsername($('#authUsername'));restrictUsername($('#usernameInput'));
$('#authForm').addEventListener('submit',async e=>{e.preventDefault();if(!sb)return alertError('Isi SUPABASE_URL dan SUPABASE_ANON_KEY di Environment Variables Vercel, lalu deploy ulang.');const email=$('#authEmail').value.trim().toLowerCase(),password=$('#authPassword').value;$('#authSubmit').disabled=true;try{if(registering){const username=$('#authUsername').value.trim(),name=$('#authName').value.trim();if(!/^[a-z0-9]{3,20}$/.test(username))throw new Error('Username harus 3–20 karakter, hanya huruf kecil dan angka.');if(password.length<8)throw new Error('Password minimal 8 karakter.');const {data:available,error:lookupError}=await sb.rpc('username_available',{p_username:username});if(lookupError)throw lookupError;if(available!==true)throw new Error('Username sudah digunakan. Silakan pilih username lain.');const result=await sb.auth.signUp({email,password,options:{data:{display_name:name,username},emailRedirectTo:new URL('/',window.location.origin).toString()}});if(result.error)throw result.error;if(result.data?.user?.identities?.length===0)throw new Error('Email sudah terdaftar. Silakan masuk ke akun.');if(result.data?.session){session=result.data.session;showApp();await bootstrap();setPage(getSavedDashboardPage());return;}pendingEmail=email;pendingPassword=password;pendingUsername=username;pendingName=name;$('#authForm').classList.add('hidden');$('#googleLogin').classList.add('hidden');$('#authToggle').classList.add('hidden');$('#emailOtpPanel').classList.remove('hidden');Swal.fire({icon:'success',title:'Kode verifikasi dikirim',text:`Periksa email ${email} dan masukkan kode 6 digit. Jika belum terlihat, cek folder spam.`});}else{const result=await sb.auth.signInWithPassword({email,password});if(result.error)throw result.error;session=result.data.session;showApp();await bootstrap();setPage(getSavedDashboardPage());}}catch(err){const message=String(err?.message||'');if(!registering&&/invalid login credentials|user not found/i.test(message)){Swal.fire({icon:'warning',title:'Akun Belum Terdaftar',text:'Email belum terdaftar atau password yang dimasukkan salah. Periksa kembali data login kamu.'});}else if(/email not confirmed/i.test(message)){Swal.fire({icon:'info',title:'Email Belum Diverifikasi',text:'Periksa email dan masukkan kode verifikasi sebelum login.'});}else if(/rate limit|too many requests/i.test(message)){alertError('Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.');}else{alertError(message||'Proses autentikasi gagal. Periksa koneksi dan konfigurasi email Supabase.');}}finally{$('#authSubmit').disabled=false;}});
function readOtp(){return $$('#otpInputs input').map(x=>x.value).join('');}
$$('#otpInputs input').forEach((input,i,all)=>{input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,1);if(input.value&&all[i+1])all[i+1].focus();});input.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!input.value&&all[i-1])all[i-1].focus();});});
$('#verifyOtp').addEventListener('click',async()=>{const token=readOtp();if(token.length!==6)return alertError('Masukkan seluruh 6 digit kode OTP.');$('#verifyOtp').disabled=true;try{const {data,error}=await sb.auth.verifyOtp({email:pendingEmail,token,type:'signup'});if(error)throw error;session=data.session;if(!session){const login=await sb.auth.signInWithPassword({email:pendingEmail,password:pendingPassword});if(login.error)throw login.error;session=login.data.session;}showApp();await bootstrap();setPage(getSavedDashboardPage());}catch(e){const m=String(e?.message||'');alertError(/expired|invalid token/i.test(m)?'Kode OTP tidak valid atau sudah kedaluwarsa. Minta kode baru lalu coba lagi.':m||'Verifikasi OTP gagal.');}finally{$('#verifyOtp').disabled=false;}});
$('#resendOtp').addEventListener('click',async()=>{try{const {error}=await sb.auth.resend({type:'signup',email:pendingEmail});if(error)throw error;Swal.fire({icon:'success',title:'Kode dikirim ulang',text:'Periksa kotak masuk dan folder spam.'});}catch(e){const m=String(e?.message||'');alertError(/rate limit|too many requests/i.test(m)?'Batas pengiriman kode tercapai. Tunggu sebentar sebelum meminta kode lagi.':m||'Email OTP gagal dikirim. Periksa konfigurasi email Supabase.');}});
async function bootstrap(){
 if(bootstrapPromise)return bootstrapPromise;
 bootstrapPromise=(async()=>{await loadDashboard();renderProfile();await startLeaderboardRealtime();})();
 try{return await bootstrapPromise;}finally{bootstrapPromise=null;}
}
async function bootstrapAndRestorePage(){await bootstrap();if(session?.access_token){showApp();setPage(getSavedDashboardPage());}}

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
async function refreshProfile(){try{const d=await api('dashboard');profile=d.profile;renderBalanceDisplays();}catch(e){console.error(e);}}
function applyWebsiteSettings(settings={}){
 const banner=$('#siteAnnouncement');
 const announcement=String(settings.announcement||'').trim();
 if(banner){banner.textContent=announcement;banner.classList.toggle('hidden',!announcement);}
}
async function loadDashboard(){
 try{const d=await api('dashboard');profile=d.profile;applyWebsiteSettings(d.websiteSettings||{});renderBalanceDisplays();$('#globalOrders').textContent=Number(d.totalOrders||0).toLocaleString(uiLang==='id'?'id-ID':'en-US');$('#leaderboard').innerHTML=(d.leaderboard||[]).length?d.leaderboard.map((r,i)=>leaderRow([r.display_name,r.total_deposit,r.total_order_value],i)).join(''):`<div class="empty-state">${tr('Belum ada data deposit.')}</div>`;updateWelcome();localize($('#leaderboard')); }catch(e){$('#leaderboard').innerHTML=`<div class="empty-state">${esc(e.message)}</div>`;if(e.status===503&&/pemeliharaan/i.test(e.message)){const banner=$('#siteAnnouncement');if(banner){banner.textContent=e.message;banner.classList.remove('hidden');}}}
}
function leaderRow(r,i){return `<div class="leader-row"><div class="leader-user"><span class="rank ${i<3?'top':''}">${i+1}</span><span>${esc(r[0])}</span></div><strong>${money(r[1])}</strong><strong class="value-muted">${money(r[2])}</strong></div>`;}
function updateWelcome(){const title=$('#welcomeTitle');if(!title)return;const name=profile?.display_name||session?.user?.user_metadata?.display_name||session?.user?.email?.split('@')[0]|| (uiLang==='id'?'Pengguna':'User');title.textContent=`${uiLang==='id'?'Selamat datang':'Welcome'}, ${name}`;}
function resetSessionState(){
 stopLeaderboardRealtime();
 if(otpPollTimer){clearTimeout(otpPollTimer);otpPollTimer=null;}
 if(qrisPollTimer){clearTimeout(qrisPollTimer);qrisPollTimer=null;}
 profile=null;services=[];popularServices=[];popularCountById=new Map();selectedService=null;countries=[];selectedCountry=null;offers=[];selectedOffer=null;catalogLoaded=false;currentOrderId=null;pendingTopupRequestKey=null;activeTopupPayment=null;notifiedPaidTopupRef=null;selectedAmount=0;selectedMethod='dana';
 try{localStorage.removeItem(DASHBOARD_PAGE_KEY);sessionStorage.removeItem('sora_active_order_id');sessionStorage.removeItem('sora_topup_request_key');sessionStorage.removeItem('sora_topup_amount');sessionStorage.removeItem('sora_topup_method');sessionStorage.removeItem('sora_active_topup');}catch{}
}
function resolveProfileAssetUrl(value){
 const raw=String(value||'').trim();
 if(!raw)return '';
 if(raw.startsWith('https://')||raw.startsWith('http://')||raw.startsWith('blob:')||raw.startsWith('data:'))return raw;
 if(!sb)return '';
 let clean=raw;
 while(clean.startsWith('/'))clean=clean.slice(1);
 if(clean.startsWith('profile-assets/'))clean=clean.slice('profile-assets/'.length);
 const {data}=sb.storage.from('profile-assets').getPublicUrl(clean);
 return data?.publicUrl||'';
}
function renderProfile(){const name=profile?.display_name||session?.user?.user_metadata?.display_name||session?.user?.email?.split('@')[0]||'Pengguna';$('#profileName').textContent=name;
 $('#profileEmail').textContent=session?.user?.email||'';
 const username=profile?.username||session?.user?.user_metadata?.username||'';
 const usernameLabel=username?`@${username}`:'Username belum diatur';
 $('#profileUsername').textContent=usernameLabel;
 const initial=name.trim().slice(0,1).toUpperCase()||'S';
 $('#profileAvatarFallback').textContent=initial;
 const avatarImage=$('#profileAvatarImage');
 if(profile?.avatar_url){avatarImage.src=resolveProfileAssetUrl(profile.avatar_url);avatarImage.classList.remove('hidden');$('#profileAvatarFallback').classList.add('hidden');}
 else{avatarImage.removeAttribute('src');avatarImage.classList.add('hidden');$('#profileAvatarFallback').classList.remove('hidden');}
 const banner=$('#profileBanner');
 const bannerImage=$('#profileBannerImage');
 if(profile?.banner_url){
  bannerImage.onload=()=>{banner.classList.add('has-custom-banner');bannerImage.classList.remove('hidden');};
  bannerImage.onerror=()=>{banner.classList.remove('has-custom-banner');bannerImage.classList.add('hidden');console.error('Banner profil gagal dimuat:',profile.banner_url);};
  bannerImage.src=resolveProfileAssetUrl(profile.banner_url);
 }else{bannerImage.removeAttribute('src');bannerImage.classList.add('hidden');banner.classList.remove('has-custom-banner');}
 $('#headerAvatar').innerHTML=profile?.avatar_url?`<img src="${esc(resolveProfileAssetUrl(profile.avatar_url))}" alt="">`:esc(initial);

 updateWelcome();localize($('#page-profile'));}
let pendingAvatarFile=null,pendingBannerFile=null,avatarObjectUrl=null,bannerObjectUrl=null;
let profileEditorBaseline={displayName:'',username:''};
function profileEditorHasChanges(){
 const displayName=$('#displayNameInput')?.value.trim()||'';
 const username=$('#usernameInput')?.value.trim().toLowerCase()||'';
 return displayName!==profileEditorBaseline.displayName||username!==profileEditorBaseline.username||!!pendingAvatarFile||!!pendingBannerFile;
}
function updateProfileSaveButton(){
 const button=$('#saveProfileButton');if(!button)return;
 const saving=button.getAttribute('aria-busy')==='true';
 const dirty=profileEditorHasChanges();
 button.disabled=saving||!dirty;
 button.setAttribute('aria-disabled',String(saving||!dirty));
 button.classList.toggle('has-changes',dirty&&!saving);
}
function profileInitial(){const name=profile?.display_name||session?.user?.email?.split('@')[0]||'Sora';return name.trim().slice(0,1).toUpperCase()||'S';}
function paintEditorPreview(){
 const name=$('#displayNameInput').value.trim()||'Nama kamu';
 $('#editorNamePreview').textContent=name;
 const username=$('#usernameInput').value.trim().toLowerCase();
 const usernameLabel=username?`@${username}`:'Username belum diatur';
 $('#editorUsernamePreview').textContent=usernameLabel;
 const avatarSrc=avatarObjectUrl||(profile?.avatar_url?resolveProfileAssetUrl(profile.avatar_url):'');
 if(avatarSrc){$('#editorAvatarImage').src=avatarSrc;$('#editorAvatarImage').classList.remove('hidden');$('#editorAvatarFallback').classList.add('hidden');}
 else{$('#editorAvatarImage').removeAttribute('src');$('#editorAvatarImage').classList.add('hidden');$('#editorAvatarFallback').textContent=name.slice(0,1).toUpperCase();$('#editorAvatarFallback').classList.remove('hidden');}
 const banner=$('#editorBannerPreview');
 const bannerImage=$('#editorBannerPreviewImage');
 const bannerSrc=bannerObjectUrl||(profile?.banner_url?resolveProfileAssetUrl(profile.banner_url):'');
 if(bannerSrc){
  bannerImage.onload=()=>{banner.classList.add('has-custom-banner');bannerImage.classList.remove('hidden');};
  bannerImage.onerror=()=>{banner.classList.remove('has-custom-banner');bannerImage.classList.add('hidden');};
  bannerImage.src=bannerSrc;
 }else{bannerImage.removeAttribute('src');bannerImage.classList.add('hidden');banner.classList.remove('has-custom-banner');}
}
function populateProfileEditor(){
 $('#displayNameInput').value=profile?.display_name||session?.user?.user_metadata?.display_name||session?.user?.email?.split('@')[0]||'';
 $('#usernameInput').value=profile?.username||session?.user?.user_metadata?.username||'';
 pendingAvatarFile=null;pendingBannerFile=null;
 if(avatarObjectUrl)URL.revokeObjectURL(avatarObjectUrl);if(bannerObjectUrl)URL.revokeObjectURL(bannerObjectUrl);
 avatarObjectUrl=null;bannerObjectUrl=null;
 $('#avatarUpload').value='';$('#bannerUpload').value='';$('#saveProfileButton').removeAttribute('aria-busy');
 profileEditorBaseline={displayName:$('#displayNameInput').value.trim(),username:$('#usernameInput').value.trim().toLowerCase()};
 paintEditorPreview();updateProfileSaveButton();
}
async function cropBanner16x9(file){
 const imageUrl=URL.createObjectURL(file);
 const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=imageUrl;});
 URL.revokeObjectURL(imageUrl);
 const targetRatio=16/9,sourceRatio=image.width/image.height;let sx=0,sy=0,sw=image.width,sh=image.height;
 if(sourceRatio>targetRatio){sw=image.height*targetRatio;sx=(image.width-sw)/2;}else{sh=image.width/targetRatio;sy=(image.height-sh)/2;}
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;const ctx=canvas.getContext('2d');ctx.drawImage(image,sx,sy,sw,sh,0,0,1600,900);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.88));if(!blob)throw new Error('Canvas export failed');return new File([blob],`banner-${Date.now()}.jpg`,{type:'image/jpeg'});
}
async function handleProfileImageInput(input,type){
 const file=input.files?.[0];if(!file)return;
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)){input.value='';return alertError('Format gambar harus PNG, JPG, atau WebP.');}
 if(file.size>4*1024*1024){input.value='';return alertError('Ukuran gambar maksimal 4 MB.');}
 let selectedFile=file;
 if(type==='banner'){try{selectedFile=await cropBanner16x9(file);}catch(error){input.value='';return alertError('Banner tidak dapat diproses. Coba gambar lain.');}}
 const url=URL.createObjectURL(selectedFile);
 if(type==='avatar'){pendingAvatarFile=file;if(avatarObjectUrl)URL.revokeObjectURL(avatarObjectUrl);avatarObjectUrl=url;}
 else{pendingBannerFile=selectedFile;if(bannerObjectUrl)URL.revokeObjectURL(bannerObjectUrl);bannerObjectUrl=url;}
 paintEditorPreview();updateProfileSaveButton();
}
$('#editProfileButton').addEventListener('click',()=>setPage('edit-profile'));
$('#cancelProfileEdit').addEventListener('click',()=>setPage('profile'));
$('#displayNameInput').addEventListener('input',()=>{paintEditorPreview();updateProfileSaveButton();});
$('#usernameInput').addEventListener('input',()=>{paintEditorPreview();updateProfileSaveButton();});
$('#avatarUpload').addEventListener('change',e=>handleProfileImageInput(e.currentTarget,'avatar'));
$('#bannerUpload').addEventListener('change',e=>handleProfileImageInput(e.currentTarget,'banner'));
async function uploadProfileImage(file,kind){
 const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
 const path=`${session.user.id}/${kind}/${crypto.randomUUID()}.${ext}`;
 const {data,error}=await sb.storage.from('profile-assets').upload(path,file,{upsert:false,cacheControl:'3600',contentType:file.type});
 if(error){
  const detail=String(error.message||'');
  if(/bucket.*not found|not found/i.test(detail))throw new Error('Bucket profile-assets belum tersedia. Jalankan SQL profile-verification-storage-fix.sql di Supabase SQL Editor.');
  if(/row-level security|permission|not authorized|403/i.test(detail))throw new Error('Supabase Storage menolak upload. Jalankan SQL profile-verification-storage-fix.sql dan pastikan pengguna sudah login ulang.');
  throw new Error(`Upload ${kind==='avatar'?'foto profil':'banner'} gagal: ${detail||'kesalahan Storage'}`);
 }
 if(!data?.path)throw new Error('Upload selesai tetapi lokasi file dari Supabase tidak diterima.');
 return data.path;
}
async function cleanupProfileUploads(paths=[]){
 if(!paths.length)return;
 try{const {error}=await sb.storage.from('profile-assets').remove(paths);if(error)console.warn('Cleanup upload profil gagal:',error);}
 catch(error){console.warn('Cleanup upload profil gagal:',error);}
}
$('#editProfileForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!sb||!session?.user?.id)return alertError('Sesi login tidak ditemukan. Silakan masuk kembali.');
 if(!profileEditorHasChanges())return;
 const displayName=$('#displayNameInput').value.trim();
 const username=$('#usernameInput').value.trim().toLowerCase();
 if(!displayName||displayName.length>32)return alertError('Nama tampilan wajib diisi dan maksimal 32 karakter.');
 if(!/^[a-z0-9]{3,20}$/.test(username))return alertError('Username harus 3–20 karakter, hanya huruf kecil dan angka.');
 const currentName=String(profile?.display_name||session?.user?.user_metadata?.display_name||session?.user?.email?.split('@')[0]||'').trim();
 const currentUsername=String(profile?.username||session?.user?.user_metadata?.username||'').trim().toLowerCase();
 const button=$('#saveProfileButton');
 button.disabled=true;button.setAttribute('aria-busy','true');button.setAttribute('aria-disabled','true');
 try{
  const changes={};
  if(displayName!==currentName)changes.display_name=displayName;
  if(username!==currentUsername){
   const {data:available,error:availabilityError}=await sb.rpc('username_available_for_current_user',{p_username:username});
   if(availabilityError)throw new Error(`Pemeriksaan username gagal: ${availabilityError.message||'fungsi SQL belum tersedia'}. Jalankan sql/profile-save-fix.sql di Supabase.`);
   if(available!==true)throw new Error('Username sudah digunakan. Silakan pilih username lain.');
   changes.username=username;
  }

  // Upload avatar dan banner secara paralel, lalu simpan keduanya dalam satu update profil.
  const uploadJobs=[
   pendingAvatarFile?uploadProfileImage(pendingAvatarFile,'avatar'):Promise.resolve(null),
   pendingBannerFile?uploadProfileImage(pendingBannerFile,'banner'):Promise.resolve(null)
  ];
  const uploadResults=await Promise.allSettled(uploadJobs);
  const uploadedPaths=uploadResults.filter(result=>result.status==='fulfilled'&&result.value).map(result=>result.value);
  const failedUpload=uploadResults.find(result=>result.status==='rejected');
  if(failedUpload){
   await cleanupProfileUploads(uploadedPaths);
   throw failedUpload.reason;
  }
  if(uploadResults[0].status==='fulfilled'&&uploadResults[0].value)changes.avatar_url=uploadResults[0].value;
  if(uploadResults[1].status==='fulfilled'&&uploadResults[1].value)changes.banner_url=uploadResults[1].value;

  if(!Object.keys(changes).length){
   await Swal.fire({icon:'info',title:'Tidak ada perubahan',text:'Profil kamu sudah menggunakan data tersebut.'});
   return;
  }
  let updateResult;
  try{updateResult=await sb.from('profiles').update(changes).eq('id',session.user.id).select('id,display_name,username,avatar_url,banner_url').single();}
  catch(updateError){await cleanupProfileUploads(uploadedPaths);throw updateError;}
  const {data:savedProfile,error}=updateResult;
  if(error){
   await cleanupProfileUploads(uploadedPaths);
   if(error.code==='23505')throw new Error('Username sudah digunakan akun lain. Pilih username yang berbeda.');
   if(error.code==='42501'||/permission denied|not allowed/i.test(error.message||''))throw new Error('Izin database belum sesuai. Jalankan sql/profile-save-fix.sql di Supabase SQL Editor.');
   if(error.code==='PGRST116')throw new Error('Baris profil akun belum tersedia. Jalankan sql/profile-save-fix.sql di Supabase SQL Editor.');
   throw error;
  }
  if(!savedProfile){await cleanupProfileUploads(uploadedPaths);throw new Error('Baris profil akun tidak ditemukan. Jalankan sql/profile-save-fix.sql untuk memperbaiki data profil.');}
  profile={...profile,...savedProfile};
  try{const refreshed=await api('dashboard');if(refreshed?.profile)profile=refreshed.profile;}catch(refreshError){console.warn('Profil tersimpan, tetapi refresh dashboard gagal:',refreshError);}
  renderProfile();
  if(avatarObjectUrl)URL.revokeObjectURL(avatarObjectUrl);if(bannerObjectUrl)URL.revokeObjectURL(bannerObjectUrl);
  avatarObjectUrl=null;bannerObjectUrl=null;pendingAvatarFile=null;pendingBannerFile=null;
  profileEditorBaseline={displayName:$('#displayNameInput').value.trim(),username:$('#usernameInput').value.trim().toLowerCase()};
  await Swal.fire({icon:'success',title:'Profil diperbarui',text:'Perubahan profil berhasil disimpan.'});
  setPage('profile');
 }catch(error){
  console.error('Profile update failed:',error);
  const detail=String(error.message||'');
  if(/bucket.*not found/i.test(detail))alertError('Bucket profile-assets belum tersedia. Jalankan sql/profile-save-fix.sql di Supabase.');
  else alertError(detail||'Profil gagal diperbarui. Periksa koneksi dan konfigurasi Supabase.');
 }finally{button.removeAttribute('aria-busy');updateProfileSaveButton();}
});
$('#logoutButton').addEventListener('click',async()=>{resetSessionState();if(sb)await sb.auth.signOut();session=null;showLanding();});

async function loadCatalog(){
 if(catalogLoaded){renderServices();return;}
 $('#serviceGrid').innerHTML=`<div class="loading-card glass">${tr('Memuat katalog layanan live...')}</div>`;
 try{
  const d=await api('catalog');
  const upstream=Array.isArray(d.data)?d.data:(Array.isArray(d.data?.data)?d.data.data:(Array.isArray(d.data?.services)?d.data.services:[]));
  services=upstream.filter(row=>serviceLogoFile(serviceDisplayName(row.name||row.service_name||''))).slice(0,31);
  popularServices=Array.isArray(d.popular)?d.popular:[];
  popularCountById=new Map(popularServices.map(x=>[String(x.service_id),Number(x.order_count||0)]));
  catalogLoaded=true;renderServices();localize($('#page-buy'));
 }catch(e){$('#serviceGrid').innerHTML=`<div class="loading-card glass">${esc(e.message)}</div>`;}
}
function renderServices(){
 const q=$('#serviceSearch').value.trim().toLowerCase();
 const featuredOrder=['whatsapp','facebook','discord','tiktok','blibli','alibaba'];
 const featuredRank=s=>{
  const name=serviceDisplayName(s.name||s.service_name||'').toLowerCase();
  const slug=String(s.slug||'').toLowerCase();
  const value=`${name} ${slug}`;
  return featuredOrder.findIndex(key=>key==='chatgpt'?/(chat\s*gpt|openai)/i.test(value):new RegExp(key,'i').test(value));
 };
 const sorted=services.slice().sort((a,b)=>{
  const aRank=featuredRank(a),bRank=featuredRank(b);
  const aFeatured=aRank>=0,bFeatured=bRank>=0;
  if(aFeatured!==bFeatured)return aFeatured?-1:1;
  if(aFeatured&&bFeatured)return aRank-bRank;
  const aId=String(a.id),bId=String(b.id),aCount=popularCountById.get(aId)||0,bCount=popularCountById.get(bId)||0;
  if(aCount!==bCount)return bCount-aCount;
  return String(serviceDisplayName(a.name||a.service_name)).localeCompare(String(serviceDisplayName(b.name||b.service_name)));
 });
 const list=sorted.filter(s=>serviceDisplayName(s.name||s.service_name).toLowerCase().includes(q)||String(s.name||s.service_name||'').toLowerCase().includes(q)||String(s.slug||'').toLowerCase().includes(q));
 const visible=showAllServices||q?list:list.slice(0,6);
 const grid=$('#serviceGrid');
 grid.classList.toggle('is-list',showAllServices||Boolean(q));
 grid.innerHTML=visible.length?visible.map(s=>{
  const name=serviceDisplayName(s.name||s.service_name)||String(s.name||s.service_name||'');
  const logo=serviceLogoFile(name);
  const logoMarkup=logo?`<img src="/assets/service-logos/${esc(logo)}" alt="${esc(name)}" loading="lazy" decoding="async">`:`<span class="service-logo-fallback" aria-hidden="true">${esc(name.charAt(0).toUpperCase()||'?')}</span>`;
  return `<button type="button" class="service-card ${String(selectedService?.id)===String(s.id)?'selected':''}" data-service="${esc(s.id)}" aria-pressed="${String(selectedService?.id)===String(s.id)}"><span class="service-logo">${logoMarkup}</span><span class="service-meta"><b>${esc(name)}</b></span></button>`;
 }).join(''):`<div class="loading-card glass">${tr('Layanan tidak ditemukan.')}</div>`;
 $$('[data-service]').forEach(b=>b.addEventListener('click',()=>chooseService(b.dataset.service)));
 const toggle=$('#toggleAllServices');
 if(toggle){toggle.classList.toggle('hidden',!list.length||Boolean(q)||list.length<=6);toggle.textContent=showAllServices?'Tampilkan 6':'Lihat Semua';toggle.setAttribute('aria-expanded',String(showAllServices));}
 localize(grid);
}
$('#serviceSearch').addEventListener('input',()=>renderServices());
$('#toggleAllServices').addEventListener('click',()=>{showAllServices=!showAllServices;renderServices();});
async function chooseService(id){selectedService=services.find(s=>String(s.id)===String(id));selectedOffer=null;renderServices();updateSummary();await loadCountries();}
function renderCountryDropdown(){
 const list=$('#countryDropdownList'),button=$('#countryDropdownButton'),label=$('#countryDropdownLabel'),flag=$('#countryDropdownFlag');
 button.disabled=!countries.length;
 const selected=selectedCountryInfo();
 label.textContent=selected?selected.name:tr(countries.length?'Pilih negara...':'Pilih aplikasi terlebih dahulu');
 if(flag)flag.textContent=selected?countryFlag(selected):'🌐';
 list.innerHTML=countries.map(c=>{
  const code=String(c.country_code??c.code??c.id??'');
  const name=String(c.name??c.country_name??c.title??code);
  const selectedOption=String(selectedCountry??'')===code;
  return `<button type="button" class="country-option ${selectedOption?'selected':''}" role="option" aria-selected="${selectedOption}" data-country-code="${esc(code)}"><span class="country-flag" aria-hidden="true">${esc(countryFlag(c))}</span><span>${esc(name)}</span>${selectedOption?'<i class="fa-solid fa-check" aria-hidden="true"></i>':''}</button>`;
 }).join('');
 list.querySelectorAll('[data-country-code]').forEach(option=>option.addEventListener('click',async()=>{
  selectedCountry=option.dataset.countryCode;$('#countrySelect').value=selectedCountry;list.classList.add('hidden');button.setAttribute('aria-expanded','false');renderCountryDropdown();selectedOffer=null;await loadOffers();updateSummary();
 }));
 localize(list);
}
$('#countryDropdownButton').addEventListener('click',()=>{const list=$('#countryDropdownList');const opening=list.classList.contains('hidden');list.classList.toggle('hidden',!opening);$('#countryDropdownButton').setAttribute('aria-expanded',String(opening));});
document.addEventListener('click',e=>{if(!e.target.closest('.country-dropdown-wrap')){$('#countryDropdownList')?.classList.add('hidden');$('#countryDropdownButton')?.setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){$('#countryDropdownList')?.classList.add('hidden');$('#countryDropdownButton')?.setAttribute('aria-expanded','false');}
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'&&$('#page-buy')?.classList.contains('active')){e.preventDefault();$('#serviceSearch')?.focus();}
});
function applyWhatsAppDefaultCountry(){
 const serviceName=serviceDisplayName(selectedService?.name||selectedService?.service_name||'');
 if(!/whats?app/i.test(serviceName)||selectedCountry)return false;
 const indonesia=countries.find(c=>countryIsoCode(c)==='ID'||normalizeCountryName(c.name??c.country_name??c.title??'').replace(/\b\d{1,4}\b/g,' ').trim()==='indonesia');
 if(!indonesia)return false;
 selectedCountry=String(indonesia.country_code??indonesia.code??indonesia.id??'');
 $('#countrySelect').value=selectedCountry;renderCountryDropdown();
 return true;
}
function applyCountryRows(rows,preserveCountry=null){
 countries=(Array.isArray(rows)?rows:[]).slice().sort((a,b)=>(a.name||a.country_name||'').localeCompare(b.name||b.country_name||''));
 const select=$('#countrySelect');
 select.innerHTML='<option value=""></option>'+countries.map(c=>{const code=c.country_code??c.code??c.id;return `<option value="${esc(code)}">${esc(c.name??c.country_name??c.title??code)}</option>`;}).join('');
 selectedCountry=null;
 if(preserveCountry){
  const previousName=normalizeCountryName(preserveCountry.name);
  const previousComparable=previousName.replace(/\b\d{1,4}\b/g,' ').replace(/\s+/g,' ').trim();
  const previousCode=String(preserveCountry.code||'');
  const previousIso=String(preserveCountry.iso||'').toUpperCase();
  const match=(previousIso?countries.find(c=>countryIsoCode(c)===previousIso):null)
   ||countries.find(c=>{const name=normalizeCountryName(c.name??c.country_name??c.title??'');const comparable=name.replace(/\b\d{1,4}\b/g,' ').replace(/\s+/g,' ').trim();return comparable===previousComparable;})
   ||countries.find(c=>String(c.country_code??c.code??c.id??'')===previousCode);
  if(match){selectedCountry=String(match.country_code??match.code??match.id??'');select.value=selectedCountry;}
 }
 renderCountryDropdown();
}
async function loadCountries({preserveCountry=null}={}){
 const requestId=++countryLoadGeneration;
 ++offersLoadGeneration;
 const select=$('#countrySelect');
 select.innerHTML='<option value=""></option>';
 $('#offerList').innerHTML=`<div class="empty-state">${tr('Pilih negara untuk melihat penawaran server.')}</div>`;
 countries=[];selectedCountry=null;selectedOffer=null;offers=[];showAllOffers=false;$('#toggleAllOffers')?.classList.add('hidden');$('#toggleAllOffers')?.setAttribute('aria-expanded','false');renderCountryDropdown();updateSummary();
 if(!selectedService)return;
 const key=`${String(selectedService.id)}:${provider}`;
 const cachedMemory=countryCacheMemory.get(key);
 let cached=cachedMemory&&Date.now()-cachedMemory.savedAt<COUNTRY_CACHE_TTL?cachedMemory.data:null;
 if(!cached){
  try{const saved=JSON.parse(localStorage.getItem('sora_country_cache_v1')||'{}');const item=saved[key];if(item&&Array.isArray(item.data)&&Date.now()-item.savedAt<COUNTRY_CACHE_TTL)cached=item.data;}catch{}
 }
 if(cached){applyCountryRows(cached,preserveCountry);if(!preserveCountry)applyWhatsAppDefaultCountry();}
 else $('#countryDropdownLabel').textContent=uiLang==='id'?'Memuat negara...':'Loading countries...';
 try{
  const d=await api(`offers?resource=countries&service_id=${encodeURIComponent(selectedService.id)}&provider=${provider}`);
  if(requestId!==countryLoadGeneration||key!==`${String(selectedService?.id)}:${provider}`)return;
  const data=Array.isArray(d.data)?d.data:(Array.isArray(d.data?.data)?d.data.data:(Array.isArray(d.data?.countries)?d.data.countries:[]));
  countryCacheMemory.set(key,{data,savedAt:Date.now()});
  try{const saved=JSON.parse(localStorage.getItem('sora_country_cache_v1')||'{}');saved[key]={data,savedAt:Date.now()};const entries=Object.entries(saved).sort((a,b)=>b[1].savedAt-a[1].savedAt).slice(0,40);localStorage.setItem('sora_country_cache_v1',JSON.stringify(Object.fromEntries(entries)));}catch{}
  const previous=selectedCountryInfo()||preserveCountry;
  applyCountryRows(data,previous);
  if(!preserveCountry)applyWhatsAppDefaultCountry();
  if(selectedCountry)await loadOffers();
  else $('#offerList').innerHTML=`<div class="empty-state">${tr('Pilih negara untuk melihat penawaran server.')}</div>`;
 }catch(e){
  if(requestId!==countryLoadGeneration||key!==`${String(selectedService?.id)}:${provider}`)return;
  if(!cached){$('#countryDropdownLabel').textContent=uiLang==='id'?'Gagal memuat negara':'Could not load countries';alertError(e.message);}
  else{console.warn('Country cache kept after refresh error:',e.message);if(!preserveCountry)applyWhatsAppDefaultCountry();if(selectedCountry)await loadOffers();}
 }
 updateSummary();
}
$$('.provider-tab').forEach(b=>b.addEventListener('click',async()=>{
 if(b.dataset.provider===provider)return;
 const previousCountry=selectedCountryInfo();
 $$('.provider-tab').forEach(x=>x.classList.toggle('active',x===b));
 provider=b.dataset.provider;
 // Reload the selected service's country list for the new provider and remap the
 // current selection by ISO country identity, then by normalized name/code.
 if(selectedService)await loadCountries({preserveCountry:previousCountry});
 else{countries=[];selectedCountry=null;renderCountryDropdown();}
 updateSummary();
}));
async function loadOffers(){
 if(!selectedService||!selectedCountry)return;
 const requestId=++offersLoadGeneration;
 const serviceId=String(selectedService.id),countryCode=String(selectedCountry),currentProvider=provider;
 showAllOffers=false;$('#toggleAllOffers')?.classList.add('hidden');$('#offerList').innerHTML=`<div class="empty-state">${tr('Memuat penawaran...')}</div>`;
 try{
  const d=await api(`offers?service_id=${encodeURIComponent(serviceId)}&provider=${currentProvider}&country_code=${encodeURIComponent(countryCode)}`);
  if(requestId!==offersLoadGeneration||serviceId!==String(selectedService?.id)||countryCode!==String(selectedCountry)||currentProvider!==provider)return;
  const data=Array.isArray(d.data)?d.data:(d.data?.data||[]);offers=data;renderOffers();
 }catch(e){
  if(requestId!==offersLoadGeneration||serviceId!==String(selectedService?.id)||countryCode!==String(selectedCountry)||currentProvider!==provider)return;
  offers=[];$('#offerList').innerHTML=`<div class="empty-state">${esc(e.message)}</div>`;
 }
 localize($('#offerList'));
}
function offerLabel(o,i){return `Server ${i+1}`;}
function renderOffers(){const visible=showAllOffers?offers:offers.slice(0,16);$('#offerList').innerHTML=visible.length?visible.map((o,i)=>{const rawStock=Number(o.stock||0),stock=Number.isFinite(rawStock)?Math.max(0,Math.trunc(rawStock)):0;return `<label class="offer-card ${selectedOffer?.provider_id===o.provider_id?'selected':''} ${stock<=0?'out-of-stock':''}"><span class="offer-card-server">${esc(offerLabel(o,i))}</span><strong class="offer-stock">Stok ${String(stock).padStart(2,'0')}</strong><span class="offer-price">${money(o.price)}</span><input type="radio" name="offer" value="${i}" ${selectedOffer?.provider_id===o.provider_id?'checked':''} ${stock<=0?'disabled':''}></label>`;}).join(''):'<div class="empty-state">Tidak ada server tersedia untuk pilihan ini.</div>';const toggle=$('#toggleAllOffers');if(toggle){toggle.classList.toggle('hidden',offers.length<=16);toggle.textContent=showAllOffers?'Tampilkan 16':'Lihat Semua';toggle.setAttribute('aria-expanded',String(showAllOffers));}$$('.offer-card').forEach((row,i)=>row.addEventListener('click',()=>{const offer=visible[i];if(Number(offer.stock||0)<=0)return;selectedOffer=offer;renderOffers();updateSummary();}));localize($('#offerList'));}
$('#toggleAllOffers').addEventListener('click',()=>{showAllOffers=!showAllOffers;renderOffers();});
function updateSummary(){const price=Number(selectedOffer?.price||0),balance=Number(profile?.balance||0);$('#orderTotal').textContent=money(price);$('#balanceAfter').textContent=money(balance-price);$('#buyButton').disabled=!(selectedService&&selectedCountry&&selectedOffer&&price>0);}
$('#buyButton').addEventListener('click',async()=>{if(!selectedOffer)return;const price=Number(selectedOffer.price);if(Number(profile?.balance||0)<price){await Swal.fire({icon:'warning',title:'Saldo Anda Kurang',text:'Silakan top up saldo terlebih dahulu untuk melanjutkan pembelian.',showCancelButton:true,confirmButtonText:'Topup sekarang',cancelButtonText:'Nanti'}).then(r=>{if(r.isConfirmed)setPage('topup');});return;}
 const confirm=await Swal.fire({title:'Konfirmasi pembelian',html:`<div style="text-align:left">${esc(selectedService.name)}<br>${esc(offerLabel(selectedOffer,Math.max(0,offers.indexOf(selectedOffer))))}<br><b>${money(price)}</b></div>`,showCancelButton:true,confirmButtonText:'Beli nomor',cancelButtonText:'Batal'});if(!confirm.isConfirmed)return;$('#buyButton').disabled=true;try{const result=await api('order',{method:'POST',body:JSON.stringify({service_id:selectedService.id,service_name:selectedService.name,provider,country_code:selectedCountry,provider_id:selectedOffer.provider_id,quoted_price:price})});await refreshProfile();updateSummary();currentOrderId=result.custom_order_id||result.order?.custom_order_id||null;currentOrderCreatedAt=Date.now();if(!currentOrderId)throw new Error('Pesanan dibuat tetapi ID belum diterima. Periksa menu Riwayat sebelum mencoba membeli lagi.');sessionStorage.setItem('sora_active_order_id',currentOrderId);setPage('otp');}catch(e){if(e.status===402||e.message.includes('Saldo Anda Kurang')){await Swal.fire({icon:'warning',title:'Saldo Anda Kurang',text:'Saldo tidak cukup untuk pembelian ini.',showCancelButton:true,confirmButtonText:'Topup',cancelButtonText:'Tutup'}).then(r=>{if(r.isConfirmed)setPage('topup');});}else alertError(e.message);}finally{updateSummary();}});

let pendingTopupRequestKey=sessionStorage.getItem('sora_topup_request_key')||null;
const validPaymentMethods=new Set(['dana','qris']);
const paymentMethodLabels={dana:'DANA',qris:'QRIS'};
let selectedMethod=validPaymentMethods.has(sessionStorage.getItem('sora_topup_method'))?sessionStorage.getItem('sora_topup_method'):'dana';
function renderPaymentMethods(){
 $$('[data-method]').forEach(card=>{
  const active=card.dataset.method===selectedMethod;
  card.classList.toggle('selected',active);
  card.setAttribute('aria-pressed',String(active));
 });
}
renderPaymentMethods();
if(pendingTopupRequestKey){selectedAmount=Number(sessionStorage.getItem('sora_topup_amount')||0);$$('[data-amount]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.amount)===selectedAmount));}
function updateTopupButtonState(){$('#topupButton').disabled=!(selectedAmount&&validPaymentMethods.has(selectedMethod));}
updateTopupButtonState();
$$('[data-amount]').forEach(b=>b.addEventListener('click',()=>{$$('[data-amount]').forEach(x=>x.classList.toggle('selected',x===b));const nextAmount=Number(b.dataset.amount);if(nextAmount!==selectedAmount){pendingTopupRequestKey=null;sessionStorage.removeItem('sora_topup_request_key');}selectedAmount=nextAmount;sessionStorage.setItem('sora_topup_amount',String(selectedAmount));updateTopupButtonState();}));
$$('[data-method]').forEach(b=>b.addEventListener('click',()=>{
 const nextMethod=b.dataset.method;
 if(!validPaymentMethods.has(nextMethod))return;
 if(nextMethod!==selectedMethod){pendingTopupRequestKey=null;sessionStorage.removeItem('sora_topup_request_key');}
 selectedMethod=nextMethod;
 sessionStorage.setItem('sora_topup_method',selectedMethod);
 renderPaymentMethods();
 updateTopupButtonState();
}));
$('#topupButton').addEventListener('click',async()=>{if(!selectedAmount||!validPaymentMethods.has(selectedMethod))return;$('#topupButton').disabled=true;try{if(!pendingTopupRequestKey){pendingTopupRequestKey=crypto.randomUUID();sessionStorage.setItem('sora_topup_request_key',pendingTopupRequestKey);sessionStorage.setItem('sora_topup_amount',String(selectedAmount));sessionStorage.setItem('sora_topup_method',selectedMethod);}let d=await api('create-payment',{method:'POST',headers:{'Idempotency-Key':pendingTopupRequestKey},body:JSON.stringify({amount:selectedAmount,payment_method:selectedMethod})});const p=d.payment||{};const methodLabel=d.payment_method_label||paymentMethodLabels[selectedMethod]||'Pembayaran';const checkout=p.payment_link||'';const topupData={merchant_ref_id:d.merchant_ref_id||'',amount:selectedAmount,method:methodLabel,status:d.already_paid?'paid':(p.status||'pending'),payment_link:checkout,qr_link:p.qr_link||null,qr_data_url:p.qr_data_url||null,is_direct_qris:Boolean(p.is_direct_qris),expired_at:p.expired_at||null};activeTopupPayment=topupData;try{sessionStorage.setItem('sora_active_topup',JSON.stringify(topupData));}catch{}pendingTopupRequestKey=null;sessionStorage.removeItem('sora_topup_request_key');sessionStorage.removeItem('sora_topup_amount');if(selectedMethod==='qris'){setPage('qris');return;}$('#paymentResult').classList.remove('hidden');const expiryText=p.expired_at?new Date(p.expired_at).toLocaleString(dateLocale):'Sesuai batas waktu pada halaman pembayaran';$('#paymentResult').innerHTML=`<b>${d.already_paid?'Pembayaran sudah diterima':'Tagihan dibuat'} · ${esc(methodLabel)} · ${money(selectedAmount)}</b><p>ID: ${esc(topupData.merchant_ref_id)}</p><p>Batas bayar: ${esc(expiryText)}</p>${checkout?`<a href="${esc(checkout)}" target="_blank" rel="noopener noreferrer">Buka halaman pembayaran ${esc(methodLabel)} <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`:''}<div style="margin-top:10px"><button id="openTopupStatusBtn" class="mini-glass" type="button">Lihat status tagihan</button></div><p class="tiny-note">Di mode demo/sandbox tautan menuju halaman simulator; di mode production langsung mengarah ke halaman pembayaran/aplikasi DANA. Saldo bertambah otomatis setelah pembayaran terverifikasi.</p>`;$('#openTopupStatusBtn')?.addEventListener('click',()=>setPage('qris'));}catch(e){alertError(e.message);}finally{updateTopupButtonState();}});

async function loadHistory(){try{const d=await api('history');renderHistory(d);if(historyMode==='topups')refreshProfile();}catch(e){$('#historyList').innerHTML=`<div class="loading-card glass">${esc(e.message)}</div>`;}}
function renderHistory(d){
 const rows=historyMode==='orders'?(d.orders||[]):(d.topups||[]);
 $('#historyList').innerHTML=rows.length?rows.map(r=>{
  const id=r.custom_order_id||r.merchant_ref_id;const name=r.service_name||'Top up saldo';const status=String(r.status||'pending');
  return `<div class="history-item"><div><b>${esc(id)}</b><small>${esc(name)} · ${new Date(r.created_at).toLocaleString(uiLang==='id'?'id-ID':deviceLocale)}</small><span class="status-pill ${status==='pending'||status==='awaiting_otp'?'pending':''}">${esc(r.refunded_at?'refunded 100%':status.replaceAll('_',' '))}</span>${historyMode==='orders'?`<button class="mini-glass history-open-order" type="button" data-open-order="${esc(id)}">Buka detail OTP</button>`:`<button class="mini-glass history-open-order" type="button" data-open-topup="${esc(id)}">Lihat detail pembayaran</button>`}</div><strong>${money(r.amount)}</strong></div>`;
 }).join(''):`<div class="loading-card glass">${tr('Belum ada transaksi.')}</div>`;
 localize($('#historyList'));
 $$('#historyList [data-open-order]').forEach(button=>button.addEventListener('click',()=>{currentOrderId=button.dataset.openOrder;sessionStorage.setItem('sora_active_order_id',currentOrderId);currentOrderCreatedAt=Date.now();setPage('otp');}));
 $$('#historyList [data-open-topup]').forEach(button=>button.addEventListener('click',()=>{
  const match=(d.topups||[]).find(x=>x.merchant_ref_id===button.dataset.openTopup);
  if(!match)return;
  activeTopupPayment={merchant_ref_id:match.merchant_ref_id,amount:Number(match.amount||0),method:match.qr_link?'QRIS':'Pembayaran',status:match.status||'pending',payment_link:match.payment_link||'',qr_link:match.qr_link||null,qr_data_url:match.qr_data_url||null,is_direct_qris:Boolean(match.qr_link),expired_at:match.expires_at||null};
  try{sessionStorage.setItem('sora_active_topup',JSON.stringify(activeTopupPayment));}catch{}
  setPage('qris');
 }));
}
$$('[data-history]').forEach(b=>b.addEventListener('click',()=>{$$('[data-history]').forEach(x=>x.classList.toggle('active',x===b));historyMode=b.dataset.history;loadHistory();}));

// OTP order detail: poll the same order ID, reveal Copy only after a code is received,
// and never credit a refund until NokosPusat confirms a no-OTP terminal state.
function setOtpStatus(message,kind='pending'){
 const el=$('#otpStatus');el.textContent=message;el.className=`otp-state ${kind}`;
}
function renderOtpSnapshot(data){
 $('#otpOrderRef').textContent=data.custom_order_id||currentOrderId||'—';
 $('#otpNumber').textContent=data.phone||'Nomor sedang dialokasikan';
 const code=String(data.otp||'').trim();
 $('#otpValue').textContent=code||'Menunggu OTP';
 $('#copyOtpButton').classList.toggle('hidden',!code);
 $('#otpCancelButton').classList.toggle('hidden',!data.can_cancel||Boolean(code)||Boolean(data.has_receipt)||Boolean(data.refunded_at)||Boolean(data.cancel_requested_at));
 if(data.refunded_at){setOtpStatus('Refund 100% berhasil dikembalikan ke saldo','success');$('#otpCancelButton').classList.add('hidden');}
 else if(code||['completed','success'].includes(data.status)){setOtpStatus('OTP diterima','success');$('#otpCancelButton').classList.add('hidden');}
 else if(data.has_receipt){setOtpStatus('Bukti pesan tercatat. Sinkronisasi OTP…','pending');$('#otpCancelButton').classList.add('hidden');}
 else if(data.cancel_requested_at){setOtpStatus('Menunggu konfirmasi pembatalan dari provider','pending');$('#otpCancelButton').classList.add('hidden');}
 else if(data.allocation_pending||['allocating','allocation_uncertain','pending'].includes(data.status)&&!data.phone){setOtpStatus('Menunggu alokasi nomor','pending');}
 else if(['cancelled','canceled','expired'].includes(data.status)){setOtpStatus('Pesanan berakhir. Memastikan refund saldo 100%','pending');$('#otpCancelButton').classList.add('hidden');}
 else{setOtpStatus('Menunggu OTP','pending');}
 const note=data.refunded_at?'Saldo telah dikembalikan penuh ke saldo Garda OTP.':data.has_receipt?'NokosPusat sudah mencatat bukti pesan/receipt. Kode mungkin masih disinkronkan. Pesanan dengan bukti pesan tidak memenuhi syarat refund 100%, walaupun kolom OTP masih kosong.':data.cancel_requested_at?'Permintaan pembatalan sedang diverifikasi. Saldo belum dikembalikan sebelum status terminal dikonfirmasi.':data.can_cancel?'Nomor belum menerima OTP atau bukti pesan. Kamu dapat mengajukan pembatalan sesuai kelayakan provider.':'Garansi 100% berlaku bila tidak ada OTP/bukti pesan dan NokosPusat mengonfirmasi status cancelled/expired. Pengembalian masuk ke saldo Garda OTP, bukan ke rekening atau QRIS.';
 $('#otpWarrantyNote').textContent=note;
}
function scheduleOtpPoll(data={}){
 if(otpPollTimer)clearTimeout(otpPollTimer);
 if(!currentOrderId||!session?.access_token)return;
 if(data.refunded_at||data.otp||['completed','success'].includes(data.status))return;
 const age=Date.now()-currentOrderCreatedAt;
 const defaultDelay=age<120000?5000:15000;
 const providerDelay=Math.max(0,Number(data.next_check_after_seconds||0))*1000;
 const delay=Math.max(defaultDelay,providerDelay||defaultDelay);
 otpPollTimer=setTimeout(()=>refreshCurrentOrder(true),delay);
}
async function refreshCurrentOrder(silent=false){
 if(!currentOrderId||otpPollInFlight)return;
 otpPollInFlight=true;
 try{const data=await api(`order-status?id=${encodeURIComponent(currentOrderId)}`);renderOtpSnapshot(data);scheduleOtpPoll(data);}
 catch(error){if(!silent)setOtpStatus('Status OTP belum dapat diperbarui. Mencoba lagi…','pending');scheduleOtpPoll({});}
 finally{otpPollInFlight=false;}
}
function loadCurrentOrder(){
 if(!currentOrderId){$('#otpOrderRef').textContent='—';$('#otpNumber').textContent='—';$('#otpValue').textContent='Menunggu OTP';$('#copyOtpButton').classList.add('hidden');$('#otpCancelButton').classList.add('hidden');setOtpStatus('Pilih pesanan dari menu Riwayat untuk melihat OTP','pending');return;}
 $('#otpOrderRef').textContent=currentOrderId;$('#otpNumber').textContent='Memuat nomor…';$('#otpValue').textContent='Menunggu OTP';$('#copyOtpButton').classList.add('hidden');$('#otpCancelButton').classList.add('hidden');setOtpStatus('Memeriksa status pesanan…','pending');refreshCurrentOrder(false);
}
$('#copyOtpButton').addEventListener('click',async()=>{const value=$('#otpValue').textContent;if(!value||value==='Menunggu OTP')return;try{await navigator.clipboard.writeText(value);Swal.fire({toast:true,position:'top',icon:'success',title:'OTP berhasil disalin',showConfirmButton:false,timer:1500});}catch{alertError('Clipboard tidak tersedia di browser ini.');}});
$('#otpCancelButton').addEventListener('click',async()=>{
 const confirmed=await Swal.fire({icon:'warning',title:'Ajukan pembatalan?',text:'Saldo akan kembali 100% hanya setelah NokosPusat mengonfirmasi pesanan dibatalkan/kedaluwarsa dan tidak ada OTP atau bukti pesan.',showCancelButton:true,confirmButtonText:'Ajukan pembatalan',cancelButtonText:'Kembali'});
 if(!confirmed.isConfirmed||!currentOrderId)return;
 $('#otpCancelButton').disabled=true;
 try{const data=await api('cancel-order',{method:'POST',body:JSON.stringify({id:currentOrderId})});renderOtpSnapshot(data);await Swal.fire({icon:data.refunded?'success':'info',title:data.refunded?'Saldo dikembalikan':'Pembatalan diproses',text:data.message||'Status pembatalan sedang diverifikasi provider.'});scheduleOtpPoll(data);}
 catch(error){await Swal.fire({icon:'info',title:'Belum dapat dipastikan',text:error.message});refreshCurrentOrder(true);}
 finally{$('#otpCancelButton').disabled=false;}
});
function formatTopupStatus(status){
 const normalized=String(status||'pending').toLowerCase();
 if(normalized==='paid'||normalized==='completed'||normalized==='success')return {label:'Success',kind:'success',paid:true,terminal:true};
 if(['expired','failed','cancelled','canceled'].includes(normalized))return {label:normalized==='expired'?'Expired':'Failed',kind:'failed',paid:false,terminal:true};
 return {label:'Pending',kind:'pending',paid:false,terminal:false};
}
function renderQrisSnapshot(data){
 const info=data||{};
 const state=formatTopupStatus(info.status);
 $('#qrisRef').textContent=info.merchant_ref_id||'—';
 $('#qrisAmount').textContent=money(info.amount||0);
 $('#qrisMethod').textContent=info.method||'QRIS';
 $('#qrisStatusBadge').textContent=state.label;
 $('#qrisStatusBadge').className=`qris-state ${state.kind}`;
 $('#qrisStatusText').textContent=state.label;
 $('#qrisStatusText').className=`qris-status-value ${state.kind}`;
 $('#qrisHeadline').textContent=state.paid?'Pembayaran berhasil':state.terminal?'Tagihan berakhir':'Menunggu pembayaran';
 const expiresAt=info.expired_at&&Number.isFinite(Date.parse(info.expired_at))?new Date(info.expired_at).toLocaleString(dateLocale):'Sesuai batas waktu di checkout';
 $('#qrisExpires').textContent=expiresAt;
 const img=$('#qrisImage'),placeholder=$('#qrisPlaceholder'),hint=$('#qrisHint');
 if(info.qr_data_url&&!state.terminal){
  img.src=info.qr_data_url;
  img.classList.remove('hidden');
  placeholder.classList.add('hidden');
  hint.textContent=info.is_direct_qris?'Scan kode QRIS di atas dengan GoPay, DANA, OVO, ShopeePay, atau Mobile Banking.':'Scan kode di atas dengan kamera HP atau klik tombol di bawah untuk menampilkan QRIS checkout.';
 }else{
  img.removeAttribute('src');
  img.classList.add('hidden');
  placeholder.classList.remove('hidden');
  placeholder.innerHTML=state.paid?'<i class="fa-solid fa-circle-check" aria-hidden="true"></i><span>Pembayaran terverifikasi</span>':state.terminal?'<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i><span>Tagihan kedaluwarsa</span>':'<i class="fa-solid fa-qrcode" aria-hidden="true"></i><span>Memuat QRIS…</span>';
  hint.textContent=state.paid?'Pembayaran sudah terkonfirmasi dan saldo akun Anda telah ditambahkan.':state.terminal?'Silakan buat tagihan top up baru jika masih ingin mengisi saldo.':'Status pembayaran diperbarui otomatis.';
 }
 const openBtn=$('#qrisOpenLink'),copyBtn=$('#qrisCopyLink'),buyBtn=$('#qrisBuyNumberBtn');
 const link=String(info.payment_link||'');
 if(link&&!state.terminal){
  openBtn.href=link;
  openBtn.classList.remove('hidden');
  copyBtn.classList.remove('hidden');
 }else{
  openBtn.href='#';
  openBtn.classList.add('hidden');
  copyBtn.classList.add('hidden');
 }
 buyBtn.classList.toggle('hidden',!state.paid);
}
function scheduleQrisPoll(){
 if(qrisPollTimer)clearTimeout(qrisPollTimer);
 if(!activeTopupPayment?.merchant_ref_id||!session?.access_token)return;
 if(!$('#page-qris')?.classList.contains('active'))return;
 const state=formatTopupStatus(activeTopupPayment.status);
 if(state.terminal)return;
 qrisPollTimer=setTimeout(()=>refreshCurrentTopup(),3000);
}
async function refreshCurrentTopup(){
 if(!activeTopupPayment?.merchant_ref_id||qrisPollInFlight)return;
 qrisPollInFlight=true;
 try{
  const h=await api(`history?ref=${encodeURIComponent(activeTopupPayment.merchant_ref_id)}`);
  const match=(h.topups||[]).find(x=>x.merchant_ref_id===activeTopupPayment.merchant_ref_id);
  if(match){
   activeTopupPayment={
    ...activeTopupPayment,
    amount:Number(match.amount||activeTopupPayment.amount||0),
    status:match.status||activeTopupPayment.status,
    payment_link:match.payment_link||activeTopupPayment.payment_link,
    qr_link:match.qr_link||activeTopupPayment.qr_link,
    qr_data_url:match.qr_data_url||activeTopupPayment.qr_data_url,
    is_direct_qris:Boolean(match.qr_link||activeTopupPayment.is_direct_qris),
    expired_at:match.expires_at||activeTopupPayment.expired_at
   };
   try{sessionStorage.setItem('sora_active_topup',JSON.stringify(activeTopupPayment));}catch{}
   renderQrisSnapshot(activeTopupPayment);
   const state=formatTopupStatus(activeTopupPayment.status);
   if(state.paid){
    await refreshProfile();
    if(notifiedPaidTopupRef!==activeTopupPayment.merchant_ref_id){
     notifiedPaidTopupRef=activeTopupPayment.merchant_ref_id;
     Swal.fire({toast:true,position:'top',icon:'success',title:'Pembayaran berhasil! Saldo sudah masuk.',showConfirmButton:false,timer:2600});
    }
    return;
   }
  }
 }catch{}
 finally{qrisPollInFlight=false;}
 scheduleQrisPoll();
}
function loadCurrentTopup(){
 if(!activeTopupPayment?.merchant_ref_id){
  renderQrisSnapshot({merchant_ref_id:'—',amount:0,status:'pending',method:'QRIS'});
  return;
 }
 renderQrisSnapshot(activeTopupPayment);
 const state=formatTopupStatus(activeTopupPayment.status);
 if(!state.terminal){refreshCurrentTopup();}
 else if(state.paid){refreshProfile();}
}
$('#qrisCopyLink')?.addEventListener('click',async()=>{
 const value=activeTopupPayment?.qr_link||activeTopupPayment?.payment_link||'';
 if(!value)return;
 try{await navigator.clipboard.writeText(value);Swal.fire({toast:true,position:'top',icon:'success',title:'Link pembayaran disalin',showConfirmButton:false,timer:1500});}
 catch{alertError('Clipboard tidak tersedia di browser ini.');}
});
async function handleTopupReturn(merchantRef){
 const cleanUrl=location.pathname;history.replaceState({},'',cleanUrl);
 let matched=null;
 try{const h=await api(`history?ref=${encodeURIComponent(merchantRef)}`);matched=(h.topups||[]).find(x=>x.merchant_ref_id===merchantRef)||null;}catch{}
 activeTopupPayment={
  merchant_ref_id:merchantRef,
  amount:Number(matched?.amount||activeTopupPayment?.amount||0),
  method:activeTopupPayment?.method||(matched?.qr_link?'QRIS':'Pembayaran'),
  status:matched?.status||'pending',
  payment_link:matched?.payment_link||activeTopupPayment?.payment_link||'',
  qr_link:matched?.qr_link||activeTopupPayment?.qr_link||null,
  qr_data_url:matched?.qr_data_url||activeTopupPayment?.qr_data_url||null,
  is_direct_qris:Boolean(matched?.qr_link||activeTopupPayment?.is_direct_qris),
  expired_at:matched?.expires_at||activeTopupPayment?.expired_at||null
 };
 try{sessionStorage.setItem('sora_active_topup',JSON.stringify(activeTopupPayment));}catch{}
 setPage('qris');
}

init();
