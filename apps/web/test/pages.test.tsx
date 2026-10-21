import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import HomePage from '@/app/page';
import IndexPage from '@/app/readiness/page';
import AboutPage from '@/app/about/page';
import ScannerPage from '@/app/about/scanner/page';
import { SiteReport } from '@/components/SiteReport';
import { getSites } from '@/lib/data';
import type { SiteResult } from '@/lib/types';
import { expectNoAxeViolations } from './axe';

const recorded = (name: string) =>
  JSON.parse(readFileSync(join(__dirname, '../../../scanner/testdata/recorded', name), 'utf8')) as SiteResult;

describe('pages render accessibly', () => {
  it('home', async () => {
    const { container } = render(<HomePage />);
    expect(
      screen.getAllByText(/of tracked Indian sites use quantum-safe key exchange/).length,
    ).toBeGreaterThan(0);
    await expectNoAxeViolations(container);
  });

  it('index', async () => {
    const { container } = render(<IndexPage />);
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    await expectNoAxeViolations(container);
  });

  it('index search filters rows', () => {
    render(<IndexPage />);
    const first = getSites()[0]!;
    fireEvent.change(screen.getByPlaceholderText(/Search organisation or host/), {
      target: { value: first.host },
    });
    expect(screen.getAllByText(first.host).length).toBeGreaterThan(0);
    expect(screen.getByText(/^Showing \d+ of \d+ sites$/).textContent).toMatch(/Showing [1-9]\d* of/);
  });

  it('about + scanner', async () => {
    const a = render(<AboutPage />);
    await expectNoAxeViolations(a.container);
    a.unmount();
    const s = render(<ScannerPage />);
    expect(screen.getByText(/QDayIndiaScanner\/1.0/)).toBeTruthy();
    await expectNoAxeViolations(s.container);
  });

  it('site report (low grade) shows grade, date, fixes', async () => {
    const site = recorded('www.aiims.edu.json');
    const { container } = render(<SiteReport site={site} scannedAt="2026-10-21T03:17:00Z" history={[]} />);
    expect(screen.getAllByText('21 Oct 2026').length).toBeGreaterThan(0);
    expect(screen.getByText(/Enable hybrid post-quantum key exchange/)).toBeTruthy();
    expect(screen.getByText(/Classical \(industry-wide/)).toBeTruthy();
    await expectNoAxeViolations(container);
  });

  it('site report (unreachable) does not grade', async () => {
    const site: SiteResult = {
      host: 'down.example.in',
      org: 'Down Ltd',
      sector: 'media',
      verified: false,
      shelfLifeYears: 1,
      reachable: false,
      error: { code: 'TIMEOUT', detail: 'i/o timeout' },
      grade: null,
      hygieneFlags: [],
      hndlRisk: 0,
    };
    const { container } = render(<SiteReport site={site} scannedAt="2026-10-21T03:17:00Z" />);
    expect(screen.getByText('Could not be graded')).toBeTruthy();
    await expectNoAxeViolations(container);
  });
});
