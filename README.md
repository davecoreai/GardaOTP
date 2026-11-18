# Sora OTP

Sora OTP adalah aplikasi mobile-first dengan landing page, autentikasi Supabase, dashboard, pemesanan nomor melalui NokosPusat, dan top up QRIS melalui **SekaliPay**. Payment gateway yang digunakan hanya SekaliPay.

## Struktur
- `index.html`, `style.css`, `app.js`: frontend.
- `api/`: Vercel serverless API, termasuk `create-payment.js` dan `sekalipay-webhook.js`.
- `lib/server.js`: autentikasi, Supabase admin client, rate limit, HMAC, dan helper server.
- `sql/schema.sql`: skema database untuk instalasi baru.
- `sql/security-hardening-sekalipay.sql`: migration hardening untuk database yang sudah ada.
- `sql/leaderboard-realtime.sql`: view leaderboard terbaru dan notifikasi Supabase Realtime Broadcast.
- `sql/otp-guarantee.sql`: migration OTP, cancellation, popularity ranking, event ledger webhook, dan refund saldo 100% yang idempoten.
- `.env.example`: daftar environment variable.

## Environment variables Vercel
Wajib diatur sebagai server-side environment variables:
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NOKOS_API_KEY`, `NOKOS_BASE_URL`, `NOKOS_WEBHOOK_SECRET`, `SEKALIPAY_API_KEY`, `SEKALIPAY_SECRET_KEY`, `SEKALIPAY_BASE_URL`, `SEKALIPAY_PAYMENT_CODE`, `SEKALIPAY_IS_SANDBOX`, `APP_URL`.

Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY`, `NOKOS_API_KEY`, `SEKALIPAY_API_KEY`, atau `SEKALIPAY_SECRET_KEY` di frontend, source map, atau variabel `NEXT_PUBLIC_*`/`VITE_*`.

## NokosPusat (API live)
Backend memanggil API resmi NokosPusat dari server Vercel, bukan dari browser: katalog `/api/v1/services`, negara, offers, order, status/OTP, dan pembatalan. Kunci API harus disimpan sebagai environment variable server-side `NOKOS_API_KEY`; `NOKOS_BASE_URL` diarahkan ke `https://nokospusat.com`. Kode pembelian mengambil ulang penawaran di server, memeriksa `quoted_price`, dan mengirim `Idempotency-Key`. Katalog menampilkan 4 aplikasi teratas berdasarkan jumlah pembelian tercatat, kemudian seluruh katalog dapat digulir.

**Penting:** API key live dan endpoint pembelian melakukan transaksi nyata serta mendebit saldo NokosPusat. Jangan menguji tombol beli dengan saldo live kecuali memang siap melakukan pembelian. Saya hanya memeriksa source dan kecocokan endpoint terhadap dokumentasi; tidak ada transaksi real yang dijalankan dalam proses revisi ini.

## Alur top up dan OTP
- QRIS melalui SekaliPay adalah **top up saldo**, bukan pembayaran langsung satu nomor. Setelah webhook pembayaran menyatakan `paid`, saldo dikreditkan dan pengguna dapat memilih aplikasi lalu membeli nomor dengan saldo.
- Setelah order berhasil dibuat, frontend langsung membuka halaman OTP yang menampilkan nomor, status `Menunggu OTP`, dan kode OTP saat provider mengirimkannya. Tombol Copy baru muncul setelah kode tersedia.
- Status OTP disinkronkan dari backend NokosPusat. Polling awal 5 detik dan kemudian melambat, serta mengikuti jeda yang diberikan provider. Webhook menerima event status/OTP saat NokosPusat mengirimkannya, meski halaman browser sedang tertutup. Catatan: dokumentasi provider menyebut tidak ada event tambahan hanya karena deadline lewat; bila masa kelayakan terlewati tanpa event status, pemeriksaan GET akan berjalan lagi saat halaman OTP dibuka dari riwayat atau saat pesanan aktif dipulihkan.
- Garansi SoraOTP: pengembalian **100% dari nilai order ke saldo internal SoraOTP** ketika NokosPusat mengonfirmasi status `cancelled`/`expired` dan tidak ada OTP, receipt, atau bukti penerimaan pesan. Refund dikunci oleh transaksi database agar tidak dapat dikreditkan dua kali.
- Pembatalan dikirim hanya saat snapshot provider memberi `can_cancel: true`. Permintaan DELETE dikirim paling banyak sekali; jika provider masih memverifikasi pelepasan nomor, sistem hanya membaca status dan tidak mengulang DELETE. Jika provider menolak karena cooldown/kelayakan (409/429), penanda permintaan dilepas dan status diperiksa lagi sebelum pengguna bisa mencoba pembatalan baru.
- Jika OTP atau receipt sudah diterima, order tidak memenuhi syarat refund biasa. Saat status provider belum pasti, saldo tetap tertahan sampai ada konfirmasi; jangan menjanjikan refund instan.

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
Backup database terlebih dahulu, lalu jalankan `sql/security-hardening-sekalipay.sql` jika belum pernah diterapkan, `sql/otp-guarantee.sql`, kemudian `sql/leaderboard-realtime.sql`. Migration OTP menambah kolom status/receipt/cancel dan memperbarui refund function serta fungsi ranking aplikasi. Jangan deploy route baru sebelum migration ini dijalankan. Migration leaderboard memperbarui view agregat, membuat private Broadcast topic `leaderboard:global`, dan mengirim sinyal refresh saat profil, pesanan, atau top up berubah. Payload broadcast hanya berisi sinyal refresh; data leaderboard dimuat ulang melalui endpoint terautentikasi. Frontend juga memiliki refresh cadangan tiap 30 detik.

Pastikan Realtime Supabase aktif untuk project. Channel leaderboard bersifat private dan hanya bisa diikuti pengguna yang sudah login. Jangan mengubah policy topic menjadi public.

Daftarkan juga webhook NokosPusat dengan URL `https://soraotp.soracloud.my.id/api/nokos-webhook`, aktifkan event `order.status_changed` dan `order.otp_received`, lalu simpan secret webhook sebagai `NOKOS_WEBHOOK_SECRET` di Vercel dan redeploy. Webhook memverifikasi tanda tangan lalu membaca ulang detail order terkini dari NokosPusat sebelum menyimpan status/refund. Migration ini harus dijalankan di Supabase SQL Editor agar fitur live benar-benar aktif; mengunggah file frontend saja tidak memasang trigger database. Tinjau kebijakan RLS serta grants sesuai kebutuhan aplikasi sebelum produksi.

## Pengujian
```bash
npm install
npm run check
npm test
```

Lakukan tes sandbox: invoice pending, pembayaran sukses, signature salah, nominal salah, mode sandbox/live mismatch, webhook berulang, dan webhook untuk referensi tidak dikenal. Jangan aktifkan live sebelum semua skenario lulus.
