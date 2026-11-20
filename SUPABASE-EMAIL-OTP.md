# Konfigurasi email OTP Garda OTP

Frontend Garda OTP menggunakan `signUp()` lalu memverifikasi kode dengan `verifyOtp({ type: 'signup' })`. Agar Supabase mengirim kode angka dan bukan tautan, sesuaikan template email pendaftaran.

1. Buka **Supabase Dashboard → Authentication → Email Templates → Confirm signup**.
2. Ubah subject menjadi `Kode verifikasi Garda OTP`.
3. Gunakan konten berikut:

```html
<h2>Kode verifikasi Garda OTP</h2>
<p>Gunakan kode berikut untuk menyelesaikan pendaftaran:</p>
<h1>{{ .Token }}</h1>
<p>Kode ini bersifat pribadi. Jangan bagikan kepada siapa pun.</p>
```

4. Pastikan Email provider dan Confirm email aktif.
5. Untuk produksi, konfigurasi SMTP pengirim milik sendiri.
6. Di **Authentication → URL Configuration**, tambahkan redirect URL `https://DOMAIN-KAMU/login` dan `https://DOMAIN-KAMU/app`. Ganti domain sesuai domain Vercel yang dipakai.

`{{ .Token }}` adalah variabel OTP Supabase. Jika template masih hanya memakai `{{ .ConfirmationURL }}`, email akan berisi tautan, sementara halaman Garda OTP menunggu enam digit. Pengiriman aktual tetap tergantung konfigurasi SMTP, reputasi domain pengirim, dan rate limit proyek Supabase.

Referensi resmi: https://supabase.com/docs/guides/auth/auth-email-templates
