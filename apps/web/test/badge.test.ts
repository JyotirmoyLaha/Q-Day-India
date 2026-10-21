import { describe, expect, it } from 'vitest';
import { badgeFor, badgeSVG, gradeColor } from '@/lib/badge';

const data = {
  hosts: {
    'bank.example.in': { g: 'C', d: '2026-10-19', v: false },
    'www.safe.in': { g: 'A+', d: '2026-10-19', v: true },
  },
  repos: { 'acme/app': { repo: 'acme/app', exposure: 42, agility: 80, scannedAt: '2026-10-21T00:00:00Z' } },
};

describe('badges', () => {
  it('renders a host grade with the scan date in the accessible title', () => {
    const { svg, found } = badgeFor(new URLSearchParams('host=bank.example.in'), data);
    expect(found).toBe(true);
    expect(svg).toContain('quantum-safe TLS');
    expect(svg).toContain('>C<');
    expect(svg).toContain('scanned 2026-10-19');
    expect(svg).toContain(gradeColor('C'));
  });
  it('accepts the apex for a www host', () => {
    expect(badgeFor(new URLSearchParams('host=safe.in'), data).svg).toContain('>A+<');
  });
  it('handles unknown hosts, repos and missing params', () => {
    expect(badgeFor(new URLSearchParams('host=nope.in'), data)).toMatchObject({ found: false });
    expect(badgeFor(new URLSearchParams('repo=acme/app'), data).svg).toContain('42/100');
    expect(badgeFor(new URLSearchParams(''), data).found).toBe(false);
  });
  it('escapes text', () => {
    const svg = badgeSVG('<x>', '"&', '#000');
    expect(svg).not.toContain('<x>');
    expect(svg).toContain('&lt;x&gt;');
    expect(svg).toContain('&quot;&amp;');
  });
});
