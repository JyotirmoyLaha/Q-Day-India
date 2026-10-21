#!/usr/bin/env node
// Validates scanner output (data/latest.json, data/scans/*.json and any paths
// given as arguments) against schemas/scan.schema.json. Exits 1 on failure.
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(readFileSync(join(root, 'schemas/scan.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

let files = process.argv.slice(2);
if (files.length === 0) {
  const scans = join(root, 'data/scans');
  files = [join(root, 'data/latest.json')].filter(existsSync);
  if (existsSync(scans)) files.push(...readdirSync(scans).filter((f) => f.endsWith('.json')).map((f) => join(scans, f)));
}
let failed = 0;
for (const f of files) {
  const data = JSON.parse(readFileSync(f, 'utf8'));
  if (validate(data)) {
    console.log(`ok   ${f} (${data.results.length} hosts)`);
  } else {
    failed++;
    console.error(`FAIL ${f}`);
    for (const e of validate.errors.slice(0, 20)) console.error(`     ${e.instancePath} ${e.message}`);
  }
}
if (files.length === 0) console.log('no scan files to validate');
process.exit(failed ? 1 : 0);
