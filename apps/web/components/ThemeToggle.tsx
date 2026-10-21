'use client';

import { t } from '@/lib/i18n';

export function ThemeToggle() {
  function toggle() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('qd-theme', next);
    } catch {
      // storage unavailable (private mode): the toggle still works for this page view
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('nav.theme')}
      title={t('nav.theme')}
      className="rounded-md border border-line p-1.5 text-muted hover:text-fg"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
      </svg>
    </button>
  );
}
