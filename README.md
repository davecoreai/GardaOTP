# Sora OTP

Sora OTP adalah aplikasi mobile-first dengan landing page, autentikasi Supabase, dashboard, pemesanan nomor melalui NokosPusat, dan top up QRIS melalui **SekaliPay**. Payment gateway yang digunakan hanya SekaliPay.

## Struktur
- `index.html`, `style.css`, `app.js`: frontend.
- `api/`: Vercel serverless API, termasuk `create-payment.js` dan `sekalipay-webhook.js`.
- `lib/server.js`: autentikasi, Supabase admin client, rate limit, HMAC, dan helper server.
- `sql/schema.sql`: skema database untuk instalasi baru.
- `sql/security-hardening-sekalipay.sql`: migration hardening untuk database yang sudah ada.
- `.env.example`: daftar environment variable.

## Environment variables Vercel
Wajib diatur sebagai server-side environment variables:
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NOKOS_API_KEY`, `NOKOS_BASE_URL`, `SEKALIPAY_API_KEY`, `SEKALIPAY_SECRET_KEY`, `SEKALIPAY_BASE_URL`, `SEKALIPAY_PAYMENT_CODE`, `SEKALIPAY_IS_SANDBOX`, `APP_URL`.

Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY`, `NOKOS_API_KEY`, `SEKALIPAY_API_KEY`, atau `SEKALIPAY_SECRET_KEY` di frontend, source map, atau variabel `NEXT_PUBLIC_*`/`VITE_*`.

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
Jalankan seluruh `sql/schema.sql` pada Supabase SQL Editor.

### Project yang sudah memiliki database
Backup database terlebih dahulu, lalu jalankan `sql/security-hardening-sekalipay.sql`. Migration ini menambahkan idempotency top up, RPC settlement SekaliPay, pembatasan akses RPC sensitif, dan rate limit server-side. Tinjau kebijakan RLS serta grants sesuai kebutuhan aplikasi sebelum produksi.

## Pengujian
```bash
npm install
npm run check
npm test
```

Lakukan tes sandbox: invoice pending, pembayaran sukses, signature salah, nominal salah, mode sandbox/live mismatch, webhook berulang, dan webhook untuk referensi tidak dikenal. Jangan aktifkan live sebelum semua skenario lulus.
