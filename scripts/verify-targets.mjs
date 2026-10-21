#!/usr/bin/env node
// Collects ownership evidence for every host in targets/india.yaml:
//   - one HTTPS GET of the homepage (redirects followed): status, final URL, <title>,
//     og:site_name / og:title / application-name / meta description;
//   - the TLS certificate's subject (O / CN) and SAN list;
//   - DNS resolution.
// Output: targets/verification-evidence.json (reviewed by a maintainer; see
// scripts/apply-verification.mjs). Usage: node scripts/verify-targets.mjs [--only host,host]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import tls from 'node:tls';
import https from 'node:https';
import dns from 'node:dns/promises';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// VERIFY_UA lets a maintainer retry hosts whose bot protection blocks the scanner's User-Agent.
const UA =
  process.env.VERIFY_UA ??
  'QDayIndiaScanner/1.0 (target verification; +https://q-day-india.vercel.app/about/scanner)';
const only = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1].split(',')
  : null;

const { parse } = createRequire(join(root, 'packages', 'cbom-engine', 'package.json'))('yaml');
const targets = parse(
  readFileSync(process.env.TARGETS_FILE ?? join(root, 'targets', 'india.yaml'), 'utf8'),
).map(({ host, org, sector }) => ({ host, org, sector }));

function cert(host) {
  return new Promise((resolve) => {
    const s = tls.connect(
      { host, port: 443, servername: host, rejectUnauthorized: false, timeout: 12000 },
      () => {
        const c = s.getPeerX509Certificate();
        resolve(
          c
            ? {
                subject: c.subject.replace(/\n/g, ', '),
                issuer: c.issuer
                  .split('\n')
                  .find((l) => l.startsWith('O='))
                  ?.slice(2),
                san: (c.subjectAltName ?? '').replace(/DNS:/g, '').split(', ').slice(0, 12),
                hostnameOk: Boolean(c.checkHost(host)),
                authorized: s.authorized,
              }
            : null,
        );
        s.destroy();
      },
    );
    s.on('error', (e) => resolve({ error: e.code ?? e.message }));
    s.on('timeout', () => {
      s.destroy();
      resolve({ error: 'TIMEOUT' });
    });
  });
}

function get(url, hops = 0) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, timeout: 15000, rejectUnauthorized: false },
      (res) => {
        const loc = res.headers.location;
        if (res.statusCode >= 300 && res.statusCode < 400 && loc && hops < 5) {
          res.resume();
          let next;
          try {
            next = new URL(loc, url);
          } catch {
            return resolve({ status: res.statusCode, finalUrl: url, body: '' });
          }
          if (next.protocol === 'http:') next.protocol = 'https:';
          return resolve(get(next.href, hops + 1));
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (d) => {
          if (body.length < 300_000) body += d;
        });
        res.on('end', () => resolve({ status: res.statusCode, finalUrl: url, body }));
        res.on('error', () => resolve({ status: res.statusCode, finalUrl: url, body }));
      },
    );
    req.on('timeout', () => req.destroy(new Error('TIMEOUT')));
    req.on('error', (e) => resolve({ error: e.code ?? e.message, finalUrl: url }));
  });
}

const decode = (s) =>
  s
    ?.replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();

function meta(body, key) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
    'i',
  );
  const m = re.exec(body);
  return decode(m?.[1] ?? m?.[2]);
}

async function evidence(t) {
  let addrs = [];
  try {
    addrs = (await dns.lookup(t.host, { all: true })).map((a) => a.address);
  } catch (e) {
    return { ...t, dns: false, error: e.code ?? 'DNS_FAIL' };
  }
  const [c, page] = await Promise.all([cert(t.host), get(`https://${t.host}/`)]);
  const body = page.body ?? '';
  return {
    ...t,
    dns: true,
    addrs: addrs.slice(0, 3),
    status: page.status ?? null,
    error: page.error,
    finalUrl: page.finalUrl,
    title: decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(body)?.[1])?.slice(0, 200),
    siteName: meta(body, 'og:site_name') ?? meta(body, 'application-name'),
    ogTitle: meta(body, 'og:title')?.slice(0, 200),
    description: meta(body, 'description')?.slice(0, 240),
    h1: decode(/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(body)?.[1]?.replace(/<[^>]+>/g, ' '))?.slice(0, 160),
    cert: c,
  };
}

const list = only ? targets.filter((t) => only.includes(t.host)) : targets;
const out = [];
let i = 0;
async function worker() {
  while (i < list.length) {
    const t = list[i++];
    const e = await evidence(t);
    out.push(e);
    process.stderr.write(
      `[${out.length}/${list.length}] ${t.host} ${e.status ?? e.error ?? ''} ${e.title ?? ''}\n`.slice(
        0,
        160,
      ) + '\n',
    );
  }
}
await Promise.all(Array.from({ length: 10 }, worker));
out.sort((a, b) => a.host.localeCompare(b.host));
const file = join(
  root,
  'targets',
  only ? 'verification-evidence.partial.json' : 'verification-evidence.json',
);
writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log(`wrote ${file} (${out.length} hosts)`);
