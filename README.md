# Sora OTP

Sora OTP adalah aplikasi mobile-first dengan landing page, autentikasi Supabase, dashboard, pemesanan nomor melalui NokosPusat, dan top up QRIS melalui **SekaliPay**. Payment gateway yang digunakan hanya SekaliPay.

## Struktur
- `index.html`, `style.css`, `app.js`: frontend.
- `api/`: Vercel serverless API, termasuk `create-payment.js` dan `sekalipay-webhook.js`.
- `lib/server.js`: autentikasi, Supabase admin client, rate limit, HMAC, dan helper server.
- `sql/schema.sql`: skema database untuk instalasi baru.
- `sql/security-hardening-sekalipay.sql`: migration hardening untuk database yang sudah ada.
- `sql/leaderboard-realtime.sql`: view leaderboard terbaru dan notifikasi Supabase Realtime Broadcast.
- `.env.example`: daftar environment variable.

## Environment variables Vercel
Wajib diatur sebagai server-side environment variables:
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NOKOS_API_KEY`, `NOKOS_BASE_URL`, `SEKALIPAY_API_KEY`, `SEKALIPAY_SECRET_KEY`, `SEKALIPAY_BASE_URL`, `SEKALIPAY_PAYMENT_CODE`, `SEKALIPAY_IS_SANDBOX`, `APP_URL`.

Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY`, `NOKOS_API_KEY`, `SEKALIPAY_API_KEY`, atau `SEKALIPAY_SECRET_KEY` di frontend, source map, atau variabel `NEXT_PUBLIC_*`/`VITE_*`.

## NokosPusat (API live)
Backend memanggil API resmi NokosPusat dari server Vercel, bukan dari browser: katalog `/api/v1/services`, daftar negara `/countries`, penawaran `/offers`, saldo `/wallet`, dan pembelian `/api/v1/orders`. Kunci API harus disimpan sebagai environment variable server-side `NOKOS_API_KEY`; `NOKOS_BASE_URL` diarahkan ke `https://nokospusat.com`. Kode pembelian mengambil ulang penawaran di server, memeriksa `quoted_price`, dan mengirim `Idempotency-Key`.

**Penting:** API key live dan endpoint pembelian melakukan transaksi nyata serta mendebit saldo NokosPusat. Jangan menguji tombol beli dengan saldo live kecuali memang siap melakukan pembelian. Saya hanya memeriksa source dan kecocokan endpoint terhadap dokumentasi; tidak ada transaksi real yang dijalankan dalam proses revisi ini.

## SekaliPay
- Endpoint pembuatan tagihan memakai adapter SekaliPay yang sudah ada di source project awal (`POST /api/v1/gateway/payment`).
- Webhook callback: `https://YOUR-DOMAIN.vercel.app/api/sekalipay-webhook`.
- Webhook memverifikasi HMAC-SHA256 atas raw request body melalui header `X-Signature`.
- Saldo hanya dikreditkan untuk status `paid`/`completed`, dengan nominal dan mode pembayaran yang cocok terhadap record top up.
- RPC `credit_sekalipay_topup_once` mengunci record top up dan mengkredit saldo secara atomik, sehingga webhook berulang tidak menambah saldo dua kali.
- Request top up memakai `Idempotency-Key` UUID dan unique constraint per user di database. Retry memakai merchant reference yang sama.

**Penting:** implementasi SekaliPay dipertahankan dari adapter yang terdapat pada ZIP project awal. Format signature dan nama field yang digunakan mengikuti implementasi tersebut; konfirmasikan kembali dengan dokumentasi/akun merchant SekaliPay dan lakukan pengujian sandbox sebelum live. Tidak ada klaim bahwa webhook telah diuji terhadap akun merchant nyata.

## Database
### Instalasi baru
Jalankan `sql/schema.sql` pada Supabase SQL Editor, kemudian jalankan `sql/leaderboard-realtime.sql`.

### Project yang sudah memiliki database
Backup database terlebih dahulu, lalu jalankan `sql/security-hardening-sekalipay.sql` jika belum pernah diterapkan, kemudian jalankan `sql/leaderboard-realtime.sql`. Migration leaderboard memperbarui view agregat, membuat private Broadcast topic `leaderboard:global`, dan mengirim sinyal refresh saat profil, pesanan, atau top up berubah. Payload broadcast hanya berisi sinyal refresh; data leaderboard dimuat ulang melalui endpoint terautentikasi. Frontend juga memiliki refresh cadangan tiap 30 detik.

Pastikan Realtime Supabase aktif untuk project. Channel leaderboard bersifat private dan hanya bisa diikuti pengguna yang sudah login. Jangan mengubah policy topic menjadi public.

Migration ini harus dijalankan di Supabase SQL Editor agar fitur live benar-benar aktif; mengunggah file frontend saja tidak memasang trigger database. Tinjau kebijakan RLS serta grants sesuai kebutuhan aplikasi sebelum produksi.

## Pengujian
```bash
npm install
npm run check
npm test
```

Lakukan tes sandbox: invoice pending, pembayaran sukses, signature salah, nominal salah, mode sandbox/live mismatch, webhook berulang, dan webhook untuk referensi tidak dikenal. Jangan aktifkan live sebelum semua skenario lulus.
