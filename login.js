import { createSupabaseClientFromConfig, redirectToApp } from './auth-client.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

let sb = null;
let registering = false;
let pendingEmail = '';
let pendingPassword = '';
let googleOAuthInFlight = false;

function alertError(message) {
  Swal.fire({ icon: 'error', title: 'Terjadi kendala', text: message, confirmButtonText: 'Mengerti' });
}

function resetGoogleLoginButton() {
  googleOAuthInFlight = false;
  const button = $('#googleLogin');
  if (button) {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.classList.remove('is-loading');
  }
}

window.addEventListener('pageshow', resetGoogleLoginButton);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') resetGoogleLoginButton();
});

function setAuthMode(isRegister) {
  registering = isRegister;
  $('#authTitle').textContent = isRegister ? 'Buat akun' : 'Masuk ke akun';
  $('#authSubtitle').textContent = isRegister
    ? 'Lengkapi data berikut untuk membuat akun Garda OTP.'
    : 'Masuk untuk melanjutkan ke dashboard Garda OTP.';
  $('#nameField').classList.toggle('hidden', !isRegister);
  $('#usernameField').classList.toggle('hidden', !isRegister);
  $('#authName').required = isRegister;
  $('#authUsername').required = isRegister;
  $('#authPassword').autocomplete = isRegister ? 'new-password' : 'current-password';
  $('#passwordMeter').classList.toggle('hidden', !isRegister);
  $('#authSubmit').textContent = isRegister ? 'Buat akun' : 'Masuk';
  $('#authToggle').textContent = isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar';
  $('#emailOtpPanel').classList.add('hidden');
  $('#authForm').classList.remove('hidden');
  $('#googleLogin').classList.toggle('hidden', isRegister);
}

$('#authToggle')?.addEventListener('click', () => setAuthMode(!registering));
$('#authBack')?.addEventListener('click', () => window.location.assign('/'));

$('#authPassword')?.addEventListener('input', () => {
  const v = $('#authPassword').value;
  let score = 0;
  if (v.length >= 8) score++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
  if (/\d/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  $('#passwordStrength').style.width = `${score * 25}%`;
  $('#passwordStrength').dataset.level = String(score);
  $('#passwordHint').textContent = ['Sangat lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'][score];
});

const usernameInput = $('#authUsername');
if (usernameInput) {
  usernameInput.addEventListener('beforeinput', (e) => {
    if (e.data && /[^a-z0-9]/.test(e.data)) e.preventDefault();
  });
  usernameInput.addEventListener('input', () => {
    const clean = usernameInput.value.replace(/[^a-z0-9]/g, '').slice(0, 20);
    if (usernameInput.value !== clean) usernameInput.value = clean;
  });
}

$('#googleLogin')?.addEventListener('click', async () => {
  if (!sb) return alertError('Supabase belum terhubung. Periksa /api/public-config dan Environment Variables Vercel.');
  if (googleOAuthInFlight) return;
  const button = $('#googleLogin');
  googleOAuthInFlight = true;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.classList.add('is-loading');
  try {
    const redirectTo = new URL('/app.html', window.location.origin).toString();
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { prompt: 'select_account' } }
    });
    if (error) throw error;
    if (!data?.url) resetGoogleLoginButton();
  } catch (error) {
    console.error('Google OAuth error:', error);
    alertError(error.message || 'Login Google gagal dimulai. Periksa konfigurasi OAuth Supabase.');
    resetGoogleLoginButton();
  }
});

$('#authForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!sb) return alertError('Isi SUPABASE_URL dan SUPABASE_ANON_KEY di Environment Variables Vercel, lalu deploy ulang.');
  const email = $('#authEmail').value.trim().toLowerCase();
  const password = $('#authPassword').value;
  $('#authSubmit').disabled = true;
  try {
    if (registering) {
      const username = $('#authUsername').value.trim();
      const name = $('#authName').value.trim();
      if (!/^[a-z0-9]{3,20}$/.test(username)) {
        throw new Error('Username harus 3–20 karakter, hanya huruf kecil dan angka.');
      }
      if (password.length < 8) {
        throw new Error('Password minimal 8 karakter.');
      }
      const { data: available, error: lookupError } = await sb.rpc('username_available', { p_username: username });
      if (lookupError) throw lookupError;
      if (available !== true) throw new Error('Username sudah digunakan. Silakan pilih username lain.');
      const result = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name, username },
          emailRedirectTo: new URL('/app.html', window.location.origin).toString()
        }
      });
      if (result.error) throw result.error;
      if (result.data?.user?.identities?.length === 0) {
        throw new Error('Email sudah terdaftar. Silakan masuk ke akun.');
      }
      if (result.data?.session) {
        redirectToApp();
        return;
      }
      pendingEmail = email;
      pendingPassword = password;
      $('#authForm').classList.add('hidden');
      $('#googleLogin').classList.add('hidden');
      $('#authToggle').classList.add('hidden');
      $('#emailOtpPanel').classList.remove('hidden');
      Swal.fire({
        icon: 'success',
        title: 'Kode verifikasi dikirim',
        text: `Periksa email ${email} dan masukkan kode 6 digit. Jika belum terlihat, cek folder spam.`
      });
    } else {
      const result = await sb.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      redirectToApp();
    }
  } catch (err) {
    const message = String(err?.message || '');
    if (!registering && /invalid login credentials|user not found/i.test(message)) {
      Swal.fire({
        icon: 'warning',
        title: 'Akun Belum Terdaftar',
        text: 'Email belum terdaftar atau password yang dimasukkan salah. Periksa kembali data login kamu.'
      });
    } else if (/email not confirmed/i.test(message)) {
      Swal.fire({
        icon: 'info',
        title: 'Email Belum Diverifikasi',
        text: 'Periksa email dan masukkan kode verifikasi sebelum login.'
      });
    } else if (/rate limit|too many requests/i.test(message)) {
      alertError('Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.');
    } else {
      alertError(message || 'Proses autentikasi gagal. Periksa koneksi dan konfigurasi email Supabase.');
    }
  } finally {
    $('#authSubmit').disabled = false;
  }
});

function readOtp() {
  return $$('#otpInputs input').map((x) => x.value).join('');
}

$$('#otpInputs input').forEach((input, i, all) => {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 1);
    if (input.value && all[i + 1]) all[i + 1].focus();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !input.value && all[i - 1]) all[i - 1].focus();
  });
});

$('#verifyOtp')?.addEventListener('click', async () => {
  const token = readOtp();
  if (token.length !== 6) return alertError('Masukkan seluruh 6 digit kode OTP.');
  $('#verifyOtp').disabled = true;
  try {
    const { data, error } = await sb.auth.verifyOtp({ email: pendingEmail, token, type: 'signup' });
    if (error) throw error;
    if (!data?.session) {
      const login = await sb.auth.signInWithPassword({ email: pendingEmail, password: pendingPassword });
      if (login.error) throw login.error;
    }
    redirectToApp();
  } catch (e) {
    const m = String(e?.message || '');
    alertError(/expired|invalid token/i.test(m) ? 'Kode OTP tidak valid atau sudah kedaluwarsa. Minta kode baru lalu coba lagi.' : m || 'Verifikasi OTP gagal.');
  } finally {
    $('#verifyOtp').disabled = false;
  }
});

$('#resendOtp')?.addEventListener('click', async () => {
  try {
    const { error } = await sb.auth.resend({ type: 'signup', email: pendingEmail });
    if (error) throw error;
    Swal.fire({ icon: 'success', title: 'Kode dikirim ulang', text: 'Periksa kotak masuk dan folder spam.' });
  } catch (e) {
    const m = String(e?.message || '');
    alertError(/rate limit|too many requests/i.test(m) ? 'Batas pengiriman kode tercapai. Tunggu sebentar sebelum meminta kode lagi.' : m || 'Email OTP gagal dikirim. Periksa konfigurasi email Supabase.');
  }
});

async function initAuth() {
  resetGoogleLoginButton();
  try {
    sb = await createSupabaseClientFromConfig();
    const { data, error } = await sb.auth.getSession();
    if (!error && data?.session?.access_token) {
      redirectToApp();
      return;
    }
    sb.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) redirectToApp();
    });
  } catch (err) {
    console.warn('Auth initialization warning:', err?.message || err);
  }
}

initAuth();
