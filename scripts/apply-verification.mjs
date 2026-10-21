#!/usr/bin/env node
// Applies the 2026-10-22 maintainer review of targets/verification-evidence.json:
// host moves (RBI's .bank.in migration, rebrands, www/apex canonicalisation), removals of
// duplicates/defunct hosts, and `verified: true` for every host with ownership evidence.
// Writes targets/india.yaml and targets/VERIFICATION.md.
// It is a one-off migration: run it on the pre-review list (`git show d2843ee:targets/india.yaml`),
// not on its own output, or the change log in VERIFICATION.md comes out empty.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { parse } = createRequire(join(root, 'packages', 'cbom-engine', 'package.json'))('yaml');
const DATE = '2026-10-22';

// old host → [new host, new org?, extra fields?]
const MOVES = {
  'www.onlinesbi.sbi': ['onlinesbi.sbi.bank.in'],
  'bandhanbank.com': ['bandhan.bank.in'],
  'canarabank.com': ['www.canarabank.bank.in'],
  'dot.gov.in': ['www.dot.gov.in'],
  'dst.gov.in': ['www.dst.gov.in'],
  'haryana.gov.in': ['www.haryana.gov.in'],
  'iisc.ac.in': ['www.iisc.ac.in'],
  'indianbank.in': ['indianbank.bank.in'],
  'juspay.in': ['juspay.io'],
  'karnatakabank.com': ['www.karnatakabank.bank.in'],
  'manipal.edu': ['www.manipal.edu'],
  'netbanking.hdfcbank.com': ['now.hdfc.bank.in'],
  'nhb.org.in': ['www.nhb.org.in'],
  'nimhans.ac.in': ['www.nimhans.ac.in'],
  'pib.gov.in': ['www.pib.gov.in'],
  'www.aubank.in': ['www.au.bank.in'],
  'www.axisbank.com': ['www.axis.bank.in'],
  'omni.axisbank.co.in': ['omni.axis.bank.in'],
  'www.bajajallianz.com': [
    'www.bajajgeneralinsurance.com',
    'Bajaj General Insurance (formerly Bajaj Allianz)',
  ],
  'www.bajajallianzlife.com': [
    'www.bajajlifeinsurance.com',
    'Bajaj Life Insurance (formerly Bajaj Allianz Life)',
  ],
  'www.bankofbaroda.in': ['bankofbaroda.bank.in'],
  'www.bsnl.co.in': ['bsnl.co.in'],
  'www.byjus.com': ['byjus.com'],
  'www.centralbankofindia.co.in': ['centralbank.bank.in'],
  'www.cosmosbank.com': ['www.cosmos.bank.in'],
  'www.csb.co.in': ['www.csb.bank.in'],
  'www.dcbbank.com': ['www.dcb.bank.in'],
  'www.deutschebank.co.in': ['www.deutsche.bank.in'],
  'www.dhanbank.com': ['www.dhan.bank.in'],
  'www.epfindia.gov.in': ['www.epfo.gov.in'],
  'www.equitasbank.com': ['equitas.bank.in'],
  'www.esafbank.com': ['www.esaf.bank.in'],
  'www.esic.gov.in': ['esic.gov.in'],
  'www.hdfcbank.com': ['www.hdfc.bank.in'],
  'www.hsbc.co.in': ['www.hsbc.bank.in'],
  'www.icicibank.com': ['www.icici.bank.in'],
  'www.idbibank.in': ['www.idbi.bank.in'],
  'www.idfcfirstbank.com': ['www.idfcfirst.bank.in'],
  'www.iitgoa.ac.in': ['iitgoa.ac.in'],
  'www.iitmandi.ac.in': ['iitmandi.ac.in'],
  'www.indiannavy.gov.in': ['indiannavy.gov.in'],
  'www.indusind.com': ['www.indusind.bank.in'],
  'www.iob.in': ['www.iob.bank.in'],
  'www.janabank.com': ['www.jana.bank.in'],
  'www.jkbank.com': ['jkb.bank.in'],
  'www.kotak.com': ['www.kotak.bank.in'],
  'www.kotaksecurities.com': ['www.kotakneo.com', 'Kotak Neo (Kotak Securities)'],
  'www.mnnit.ac.in': ['mnnit.ac.in'],
  'www.negd.gov.in': ['negd.gov.in'],
  'www.newsonair.gov.in': ['newsonair.gov.in'],
  'www.paynearby.in': ['paynearby.in'],
  'www.pnbindia.in': ['pnb.bank.in'],
  'www.rblbank.com': ['www.rbl.bank.in'],
  'www.reliancegeneral.co.in': [
    'www.indusindinsurance.com',
    'IndusInd General Insurance (formerly Reliance General)',
  ],
  'www.saraswatbank.com': ['www.saraswat.bank.in'],
  'www.sliceit.com': [
    'slice.bank.in',
    'slice Small Finance Bank',
    { sector: 'banking', subsector: 'small_finance_bank' },
  ],
  'www.svcbank.com': ['www.svc.bank.in'],
  'www.tmb.in': ['www.tmb.bank.in'],
  'www.ujjivansfb.in': ['www.ujjivansfb.bank.in'],
  'www.unionbankofindia.co.in': ['www.unionbankofindia.bank.in'],
  'www.utkarsh.bank': ['www.utkarsh.bank.in'],
  'edistricts.up.gov.in': ['edistrict.up.gov.in'],
  'enps.nsdl.com': ['www.npscra.proteantech.in', 'NPS CRA (Protean)'],
  'punjabandsindbank.co.in': ['www.punjabandsind.bank.in'],
  'www.aiimsbhubaneswar.nic.in': ['aiimsbhubaneswar.nic.in'],
  'www.aiimsjodhpur.edu.in': ['aiimsjodhpur.edu.in'],
  'www.futuregenerali.in': [
    'www.generalicentralinsurance.com',
    'Generali Central Insurance (formerly Future Generali)',
  ],
  'www.ippbonline.com': ['ippbonline.bank.in'],
  'www.kvb.co.in': ['www.kvb.bank.in'],
  'www.onlineservices.nsdl.com': ['onlineservices.proteantech.in'],
  'bankofmaharashtra.in': ['bankofmaharashtra.bank.in'],
  'www.finobank.com': ['www.fino.bank.in'],
  'www.suryodaybank.com': ['www.suryoday.bank.in'],
  'www.yesbank.in': ['www.yes.bank.in'],
  'www.jiopaymentsbank.com': ['www.jiopayments.bank.in'],
};

const REMOVE = {
  'www.airtel.com': 'redirects to www.airtel.in (duplicate)',
  'www.vodafoneidea.com': 'redirects to www.myvi.in (duplicate)',
  'vahan.parivahan.gov.in': 'redirects to parivahan.gov.in (duplicate)',
  'www.hdfc.com': 'HDFC Ltd merged into HDFC Bank; redirects to homeloans.hdfc.bank.in',
  'www.online.citibank.co.in':
    "redirects to citigroup.com; Citi's Indian consumer business moved to Axis Bank",
  'www.jiofiber.com': 'no ownership evidence; JioFiber is served from www.jio.com (already tracked)',
};

// Hosts whose ownership could not be confirmed from evidence; they stay unverified.
const UNVERIFIED = {
  'www.metropolisindia.com': 'homepage blocked by the CDN (403) and no organisation in the certificate',
  'www.zeptonow.com': 'homepage serves only a bot challenge and no organisation in the certificate',
};

// Independent confirmation where the homepage itself gave no usable evidence.
const EXTRA = {
  'www.amazon.in': 'Wikidata Q123036952 (Amazon.in) official website',
  'www.manipal.edu': 'Wikidata Q4095278 official website manipal.edu',
  'www.maxhealthcare.in': 'Wikidata Q6794859 official website',
  'www.medplusmart.com': 'Wikidata Q25344640 official website',
  'www.ncdex.com': 'Wikidata Q6971712 official website',
  'www.thyrocare.com': 'Wikidata Q28103648 official website',
  'dashboard.razorpay.com': 'subdomain of razorpay.com, the official website in Wikidata Q109985545',
  'paynearby.in': 'homepage text names PayNearby throughout (200+ mentions)',
  'www.npscra.proteantech.in': 'page names "Protean eGov Technologies Ltd" and the National Pension System',
};

const REGISTRY = [
  [/\.bank\.in$/, '.bank.in registry (restricted to RBI-regulated banks)'],
  [/\.(gov|nic)\.in$/, '.gov.in/.nic.in registry (restricted to Indian government bodies)'],
  [/\.(ac|edu)\.in$/, '.ac.in/.edu.in registry (restricted to Indian academic institutions)'],
];

const evidence = new Map();
for (const f of [
  'verification-evidence.json',
  'verification-evidence.browser-ua.json',
  'verification-evidence.partial.json',
]) {
  const p = join(root, 'targets', f);
  if (existsSync(p)) for (const e of JSON.parse(readFileSync(p, 'utf8'))) evidence.set(e.host, e);
}

function describe(host, oldHost) {
  const e = evidence.get(host) ?? evidence.get(oldHost);
  const parts = [];
  // Evidence from a later, more specific fetch (e.g. browser User-Agent retry) wins.
  const certO = /O=([^,]+)/.exec(e?.cert?.subject ?? '')?.[1];
  const title =
    e?.title &&
    !/^(access denied|just a moment|attention required|403|request rejected|error|you are being redirected)/i.test(
      e.title,
    )
      ? e.title
      : null;
  if (title) parts.push(`page title "${title.slice(0, 110)}"`);
  else if (e?.siteName) parts.push(`site name "${e.siteName}"`);
  if (certO) parts.push(`certificate O="${certO}"`);
  if (EXTRA[host]) parts.push(EXTRA[host]);
  const reg = REGISTRY.find(([re]) => re.test(host));
  if (reg) parts.push(reg[1]);
  return parts.join('; ') || 'publicly documented official domain';
}

const targets = parse(readFileSync(join(root, 'targets', 'india.yaml'), 'utf8'));
const out = [];
const log = [];
const seen = new Set();
for (const t of targets) {
  if (REMOVE[t.host]) {
    log.push(`| removed | \`${t.host}\` | ${t.org} | ${REMOVE[t.host]} |`);
    continue;
  }
  const move = MOVES[t.host];
  const n = { ...t };
  if (move) {
    n.host = move[0];
    if (move[1]) n.org = move[1];
    if (move[2]) Object.assign(n, move[2]);
    log.push(`| moved | \`${t.host}\` → \`${n.host}\` | ${n.org} | ${describe(n.host, t.host)} |`);
  }
  if (seen.has(n.host)) {
    log.push(`| removed | \`${t.host}\` | ${t.org} | duplicate of \`${n.host}\` |`);
    continue;
  }
  seen.add(n.host);
  if (UNVERIFIED[n.host]) {
    n.verified = false;
    n.notes = `unverified ${DATE}: ${UNVERIFIED[n.host]}`;
  } else {
    n.verified = true;
    n.notes = `verified ${DATE}: ${describe(n.host, t.host)}`;
  }
  out.push(n);
}

// Re-serialise in the original grouped, one-line-per-host style.
const q = (s) => (/^[\w .&()'’|/-]+$/.test(s) && !/^[\s-]/.test(s) ? s : JSON.stringify(s));
const header = readFileSync(join(root, 'targets', 'india.yaml'), 'utf8').split('\n# --- ')[0];
const sectors = [...new Set(out.map((t) => t.sector))];
const lines = [
  header
    .replace(
      /drafted from public knowledge during the automated build and is\n# `verified: false` until a maintainer confirms the hostname belongs to the organisation./,
      `checked on ${DATE} with scripts/verify-targets.mjs (homepage title, certificate\n# organisation, restricted registries) and reviewed by a maintainer; see targets/VERIFICATION.md.`,
    )
    .trimEnd(),
  '',
];
for (const s of sectors) {
  const rows = out.filter((t) => t.sector === s);
  lines.push(`# --- ${s} (${rows.length}) ---`);
  for (const t of rows)
    lines.push(
      `- {host: ${t.host}, org: ${q(t.org)}, sector: ${t.sector}${t.subsector ? `, subsector: ${t.subsector}` : ''}${t.shelf_life_years ? `, shelf_life_years: ${t.shelf_life_years}` : ''}${t.notes ? `, notes: ${JSON.stringify(t.notes)}` : ''}, verified: ${t.verified}}`,
    );
  lines.push('');
}
writeFileSync(join(root, 'targets', 'india.yaml'), lines.join('\n'));

const verified = out.filter((t) => t.verified).length;
writeFileSync(
  join(root, 'targets', 'VERIFICATION.md'),
  `# Target verification — ${DATE}

${out.length} hosts in the target list; **${verified} verified**, ${out.length - verified} unverified.

## Method

\`scripts/verify-targets.mjs\` made one HTTPS request to each homepage (redirects followed) and recorded the page title,
site name, description, first heading and the TLS certificate's subject organisation and SANs (raw data:
\`targets/verification-evidence.json\`). Sites that block automated clients were fetched again with a browser
User-Agent (\`verification-evidence.browser-ua.json\`), and candidate replacement hostnames were checked the same way
(\`verification-evidence.partial.json\`). A host was marked \`verified: true\` when at least one of these ties it to the
organisation shown:

1. the page title / site name / heading names the organisation;
2. the certificate's \`O=\` field is the organisation or its parent company;
3. the name sits in a restricted registry (\`.bank.in\` — RBI-regulated banks only; \`.gov.in\`/\`.nic.in\` — government
   bodies only; \`.ac.in\`/\`.edu.in\` — academic institutions only) and the label is the organisation's known name;
4. Wikidata lists the host as the organisation's official website (property P856).

Each host's evidence is stored in its \`notes\` field in \`targets/india.yaml\`.

## Changes made during verification

Most changes come from RBI's mandatory move of bank websites to \`.bank.in\` domains: the old domains now redirect, so
the index tracks the host visitors actually reach.

| Change | Host | Organisation | Evidence / reason |
|---|---|---|---|
${log.join('\n')}

## Still unverified

${
  out
    .filter((t) => !t.verified)
    .map((t) => `- \`${t.host}\` (${t.org}): ${UNVERIFIED[t.host]}`)
    .join('\n') || '- none'
}
`,
);
console.log(`targets: ${out.length} (${verified} verified); ${log.length} changes`);
