import Link from 'next/link';
import { REPO_URL } from '@/lib/site';
import { t } from '@/lib/i18n';

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-serif text-base font-semibold text-fg">{t('site.name')}</p>
          <p className="mt-2">{t('site.tagline')}</p>
          <p className="mt-2">Open source. Runs for ₹0 on free tiers.</p>
        </div>
        <ul className="space-y-1.5">
          <li>
            <Link href="/about" className="hover:text-fg">
              Methodology &amp; limitations
            </Link>
          </li>
          <li>
            <Link href="/about/scanner" className="hover:text-fg">
              Responsible scanning &amp; opt-out
            </Link>
          </li>
          <li>
            <Link href="/learn" className="hover:text-fg">
              What is post-quantum cryptography?
            </Link>
          </li>
        </ul>
        <ul className="space-y-1.5">
          <li>
            <a href={REPO_URL} className="hover:text-fg">
              Source code &amp; data on GitHub
            </a>
          </li>
          <li>
            <Link href="/report" className="hover:text-fg">
              State of the Nation report
            </Link>
          </li>
          <li>Grades describe key exchange only, on the date shown.</li>
        </ul>
      </div>
    </footer>
  );
}
