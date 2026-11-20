# Garda OTP

Garda OTP adalah aplikasi mobile-first dengan landing page, autentikasi Supabase, dashboard, pemesanan nomor melalui NokosPusat, dan top up melalui **DOKU Checkout**. Payment gateway yang digunakan hanya DOKU.

## Struktur
- `index.html`, `style.css`, `app.js`: frontend.
- `api/`: 12 Vercel serverless API routes, termasuk `create-payment.js` dan `doku-webhook.js`.
- `lib/server.js`: autentikasi, Supabase admin client, rate limit, HMAC, dan helper server.
- `sql/schema.sql`: skema database untuk instalasi baru.
- `sql/doku-payment-migration.sql`: migration hardening untuk database yang sudah ada.
- `sql/leaderboard-realtime.sql`: view leaderboard terbaru dan notifikasi Supabase Realtime Broadcast.
- `sql/otp-guarantee.sql`: migration OTP, cancellation, popularity ranking, event ledger webhook, dan refund saldo 100% yang idempoten.

## Domain Garda OTP

Domain utama proyek ini adalah `https://gardaotp.my.id`. Di Vercel, tambahkan `gardaotp.my.id` pada **Project → Settings → Domains**, lalu pasang record DNS persis seperti nilai yang ditampilkan Vercel untuk project ini. Atur environment variable `APP_URL=https://gardaotp.my.id` pada seluruh environment yang digunakan dan redeploy.

Pada Supabase → Authentication → URL Configuration, set **Site URL** ke `https://gardaotp.my.id` dan tambahkan URL redirect yang digunakan aplikasi di domain tersebut. Daftarkan callback pembayaran ke `https://gardaotp.my.id/api/doku-webhook` dan webhook NokosPusat ke `https://gardaotp.my.id/api/nokos-webhook`.

## Environment variables Vercel
Wajib diatur sebagai server-side environment variables:
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NOKOS_API_KEY`, `NOKOS_BASE_URL`, `NOKOS_WEBHOOK_SECRET`, `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `DOKU_ENV`, `APP_URL`.

Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY`, `NOKOS_API_KEY`, `DOKU_CLIENT_ID`, atau `DOKU_SECRET_KEY` di frontend, source map, atau variabel `NEXT_PUBLIC_*`/`VITE_*`.

## NokosPusat (API live)
Backend memanggil API resmi NokosPusat dari server Vercel, bukan dari browser: katalog `/api/v1/services`, negara, offers, order, status/OTP, dan pembatalan. Kunci API harus disimpan sebagai environment variable server-side `NOKOS_API_KEY`; `NOKOS_BASE_URL` diarahkan ke `https://nokospusat.com`. Kode pembelian mengambil ulang penawaran di server, memeriksa `quoted_price`, dan mengirim `Idempotency-Key`. Katalog hanya menampilkan layanan yang memiliki pasangan logo eksplisit di `assets/service-logos`, dengan 6 kartu awal dalam grid 3 kolom dan mode daftar melalui tombol “Lihat Semua”. Bundle ini berisi 31 file logo; 28 nama layanan sudah dipasangkan secara eksplisit. Tiga gambar yang belum dapat diidentifikasi tidak ditampilkan agar tidak salah merek. Sumber `PDFlogo.pdf` yang dirujuk oleh catatan aset tidak ikut tersedia di ZIP awal.

**Penting:** API key live dan endpoint pembelian melakukan transaksi nyata serta mendebit saldo NokosPusat. Jangan menguji tombol beli dengan saldo live kecuali memang siap melakukan pembelian. Saya hanya memeriksa source dan kecocokan endpoint terhadap dokumentasi; tidak ada transaksi real yang dijalankan dalam proses revisi ini.

## Alur top up dan OTP
- Pembayaran melalui DOKU Checkout adalah **top up saldo**, bukan pembayaran langsung satu nomor. Setelah notifikasi DOKU berstatus `SUCCESS`, saldo dikreditkan dan pengguna dapat memilih aplikasi lalu membeli nomor dengan saldo.
- Setelah order berhasil dibuat, frontend langsung membuka halaman OTP yang menampilkan nomor, status `Menunggu OTP`, dan kode OTP saat provider mengirimkannya. Tombol Copy baru muncul setelah kode tersedia.
- Status OTP disinkronkan dari backend NokosPusat. Polling awal 5 detik dan kemudian melambat, serta mengikuti jeda yang diberikan provider. Webhook menerima event status/OTP saat NokosPusat mengirimkannya, meski halaman browser sedang tertutup. Catatan: dokumentasi provider menyebut tidak ada event tambahan hanya karena deadline lewat; bila masa kelayakan terlewati tanpa event status, pemeriksaan GET akan berjalan lagi saat halaman OTP dibuka dari riwayat atau saat pesanan aktif dipulihkan.
- Garansi Garda OTP: pengembalian **100% dari nilai order ke saldo internal Garda OTP** ketika NokosPusat mengonfirmasi status `cancelled`/`expired` dan tidak ada OTP, receipt, atau bukti penerimaan pesan. Refund dikunci oleh transaksi database agar tidak dapat dikreditkan dua kali.
- Pembatalan dikirim hanya saat snapshot provider memberi `can_cancel: true`. Permintaan DELETE dikirim paling banyak sekali; jika provider masih memverifikasi pelepasan nomor, sistem hanya membaca status dan tidak mengulang DELETE. Jika provider menolak karena cooldown/kelayakan (409/429), penanda permintaan dilepas dan status diperiksa lagi sebelum pengguna bisa mencoba pembatalan baru.
- Jika OTP atau receipt sudah diterima, order tidak memenuhi syarat refund biasa. Saat status provider belum pasti, saldo tetap tertahan sampai ada konfirmasi; jangan menjanjikan refund instan.

## DOKU Checkout
- Backend membuat hosted checkout melalui `POST https://api-sandbox.doku.com/checkout/v1/payment` pada mode sandbox atau `https://api.doku.com/checkout/v1/payment` pada mode production.
- Notification URL yang harus didaftarkan pada DOKU Back Office: `https://gardaotp.my.id/api/doku-webhook`.
- Request dan notifikasi diverifikasi dengan signature Non-SNAP DOKU: Client-Id, Request-Id, Request-Timestamp, Request-Target, Digest, dan HMAC-SHA256 Base64; timestamp webhook diterima hingga 24 jam untuk mendukung jadwal retry DOKU.
- Saldo hanya dikreditkan untuk `transaction.status=SUCCESS`, dengan invoice dan nominal yang cocok terhadap record top up. RPC `credit_doku_topup_once` mengunci record dan mencegah kredit ganda.
- Request top up memakai `Idempotency-Key` UUID dan unique constraint per user di database. Retry memakai merchant reference yang sama.
- Checkout URL hanya diterima jika HTTPS dan host berada di domain DOKU.

**Penting:** aktifkan metode pembayaran yang diperlukan dan daftarkan notification URL pada DOKU Dashboard. Jalankan sandbox test sebelum mengubah `DOKU_ENV=production`; kredensial merchant belum tersedia sehingga transaksi DOKU belum dapat diuji dari sini.

## Database
### Instalasi baru
Jalankan `sql/schema.sql` pada Supabase SQL Editor, kemudian jalankan `sql/leaderboard-realtime.sql`.

### Project yang sudah memiliki database
Backup database terlebih dahulu, lalu jalankan `sql/doku-payment-migration.sql` jika belum pernah diterapkan, `sql/otp-guarantee.sql`, kemudian `sql/leaderboard-realtime.sql`. Migration OTP menambah kolom status/receipt/cancel dan memperbarui refund function serta fungsi ranking aplikasi. Jangan deploy route baru sebelum migration ini dijalankan. Migration leaderboard memperbarui view agregat, membuat private Broadcast topic `leaderboard:global`, dan mengirim sinyal refresh saat profil, pesanan, atau top up berubah. Payload broadcast hanya berisi sinyal refresh; data leaderboard dimuat ulang melalui endpoint terautentikasi. Frontend juga memiliki refresh cadangan tiap 30 detik.

Pastikan Realtime Supabase aktif untuk project. Channel leaderboard bersifat private dan hanya bisa diikuti pengguna yang sudah login. Jangan mengubah policy topic menjadi public.

Daftarkan juga webhook NokosPusat dengan URL `https://gardaotp.my.id/api/nokos-webhook`, aktifkan event `order.status_changed` dan `order.otp_received`, lalu simpan secret webhook sebagai `NOKOS_WEBHOOK_SECRET` di Vercel dan redeploy. Webhook memverifikasi tanda tangan lalu membaca ulang detail order terkini dari NokosPusat sebelum menyimpan status/refund. Migration ini harus dijalankan di Supabase SQL Editor agar fitur live benar-benar aktif; mengunggah file frontend saja tidak memasang trigger database. Tinjau kebijakan RLS serta grants sesuai kebutuhan aplikasi sebelum produksi.

## Pengujian
```bash
npm install
npm run check
npm test
```

Lakukan tes sandbox DOKU: checkout pending, notifikasi SUCCESS, signature salah, timestamp kedaluwarsa, nominal salah, mode sandbox/live mismatch, webhook berulang, dan invoice tidak dikenal. Invoice pending dari payment gateway lama perlu direkonsiliasi terpisah; webhook DOKU baru tidak akan menyelesaikannya. Jangan aktifkan live sebelum semua skenario lulus.


## Edit Profile: foto dan banner

Untuk mengaktifkan fitur Edit Profile pada halaman akun, jalankan sekali isi `sql/profile-assets-storage.sql` melalui Supabase Dashboard → SQL Editor. Migrasi ini menambahkan `avatar_url` dan `banner_url`, memberi izin update hanya untuk kolom profil yang dapat diedit, serta membuat bucket publik `profile-assets` dengan kebijakan upload/update/delete yang membatasi setiap akun ke folder UUID miliknya sendiri. Nama tampilan dan username dapat diubah dari halaman Edit Profile.
