import { createSupabaseClientFromConfig, hasAuthCallbackParams, redirectToApp } from './auth-client.js';

const toggle = document.getElementById('menuToggle');
const menu = document.getElementById('landingMenu');

toggle?.addEventListener('click', () => {
  const open = menu?.classList.toggle('open') || false;
  toggle.setAttribute('aria-expanded', String(open));
  const icon = toggle.querySelector('i');
  if (icon) icon.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
});

menu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    const icon = toggle?.querySelector('i');
    if (icon) icon.className = 'fa-solid fa-bars';
  });
});

const year = document.getElementById('landingYear');
if (year) year.textContent = String(new Date().getFullYear());

let hasActiveSession = false;

async function checkLoggedInSession() {
  try {
    const sb = await createSupabaseClientFromConfig();
    const { data, error } = await sb.auth.getSession();
    if (!error && data?.session?.access_token) {
      hasActiveSession = true;
      redirectToApp();
      return;
    }
    if (hasAuthCallbackParams()) {
      sb.auth.onAuthStateChange((_event, session) => {
        if (session?.access_token) {
          hasActiveSession = true;
          redirectToApp();
        }
      });
    }
  } catch (err) {
    console.warn('Landing session check paused:', err?.message || err);
  }
}

['landingLogin', 'landingLoginMobile', 'landingStart', 'landingBottomStart'].forEach((id) => {
  document.getElementById(id)?.addEventListener('click', () => {
    window.location.assign(hasActiveSession ? '/app.html' : '/login.html');
  });
});

checkLoggedInSession();
