#!/usr/bin/env node
// One-time setup after creating the GitHub repo and the Vercel project:
//   node scripts/set-owner.mjs <github-owner> [site-url] [contact-email]
// Replaces the YOUR_GITHUB_USER / qday-india.vercel.app / contact placeholders in
// docs, workflows, site config and the dogfood badge record.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const [owner, siteURL, email] = process.argv.slice(2);
if (!owner || !/^[\w.-]+$/.test(owner)) {
  console.error(
    'usage: node scripts/set-owner.mjs <github-owner> [https://your-site.vercel.app] [contact@email]',
  );
  process.exit(2);
}
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = (siteURL ?? 'https://qday-india.vercel.app').replace(/\/$/, '');
const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    if (['node_modules', '.git', '.venv', '.next', 'dist', 'generated'].includes(f)) continue;
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(md|ts|tsx|mjs|yml|yaml|json)$/.test(f) && !p.includes(`${join('data', 'scans')}`))
      files.push(p);
  }
};
walk(root);
let changed = 0;
for (const p of files) {
  const before = readFileSync(p, 'utf8');
  let after = before.replaceAll('YOUR_GITHUB_USER', owner).replaceAll('https://qday-india.vercel.app', site);
  if (email) after = after.replaceAll('qday-india@example.org', email);
  if (after !== before && !p.endsWith('set-owner.mjs')) {
    writeFileSync(p, after);
    changed++;
    console.log(`updated ${relative(root, p)}`);
  }
}
console.log(
  `${changed} files updated. Commit the changes, then set NEXT_PUBLIC_REPO_SLUG=${owner}/qday-india in Vercel.`,
);
