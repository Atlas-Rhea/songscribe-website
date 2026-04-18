// Theme toggle — lifted from decor-preview.html
// Applies theme to <html data-theme="…">, persists to localStorage,
// falls back to prefers-color-scheme on first load.

const STORAGE_KEY = 'ss-theme';

function readPreferred() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
}

export function initTheme() {
  apply(readPreferred());
}

export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

export function toggleTheme() {
  const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  apply(next);
  localStorage.setItem(STORAGE_KEY, next);
  return next;
}

export function bindToggleButton(button) {
  if (!button) return;
  button.setAttribute('aria-pressed', String(getCurrentTheme() === 'dark'));
  button.addEventListener('click', () => {
    const theme = toggleTheme();
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.dispatchEvent(new CustomEvent('themechange', { detail: { theme }, bubbles: true }));
  });
}
