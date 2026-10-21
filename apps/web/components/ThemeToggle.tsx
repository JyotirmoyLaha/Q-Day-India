'use client';

import { t } from '@/lib/i18n';
import { Icon } from './Icon';

/** Flips light/dark. Both icons are rendered and CSS shows the right one, so there is no hydration flash. */
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
      className="btn btn-ghost !px-2.5"
    >
      <Icon name="moon" className="h-5 w-5 dark:hidden" />
      <Icon name="sun" className="hidden h-5 w-5 dark:block" />
    </button>
  );
}
