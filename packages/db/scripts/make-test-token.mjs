#!/usr/bin/env node
/**
 * Generate a signed webapp test token for a given application id.
 *
 * Usage:
 *   node packages/db/scripts/make-test-token.mjs <applicationId>
 *   node packages/db/scripts/make-test-token.mjs --pick   (auto-pick any approved application)
 *
 * Env required (from .env.local):
 *   WEBAPP_TOKEN_SECRET
 *   SUPABASE_DB_HOST/PASSWORD/etc. (only for --pick)
 */
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');

try {
  const raw = await readFile(resolve(repoRoot, '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* ok */
}

const SECRET = process.env.WEBAPP_TOKEN_SECRET;
if (!SECRET) {
  console.error('✗ WEBAPP_TOKEN_SECRET missing');
  process.exit(1);
}

function signToken(payload) {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

async function fetchAppAndCohort(appId) {
  const pg = await import('pg');
  const client = new pg.default.Client({
    host: process.env.SUPABASE_DB_HOST,
    port: Number(process.env.SUPABASE_DB_PORT || 5432),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  let row;
  if (appId) {
    const { rows } = await client.query(
      `select id, cohort_id, name from applications where id = $1 limit 1`,
      [appId],
    );
    row = rows[0];
  } else {
    const { rows } = await client.query(
      `select id, cohort_id, name from applications where status = 'approved' order by created_at desc limit 1`,
    );
    row = rows[0];
    if (!row) {
      const { rows: any } = await client.query(
        `select id, cohort_id, name from applications order by created_at desc limit 1`,
      );
      row = any[0];
    }
  }
  await client.end();
  return row;
}

const arg = process.argv[2];
const isPick = arg === '--pick' || !arg;
const appIdArg = isPick ? null : arg;

const row = await fetchAppAndCohort(appIdArg);
if (!row) {
  console.error('✗ no application found');
  process.exit(1);
}

const payload = {
  appId: row.id,
  cohortId: row.cohort_id,
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 12,
};
const token = signToken(payload);
const url = `http://localhost:3002/login?t=${token}`;

console.log('✓ token generated');
console.log('  name:      ', row.name);
console.log('  appId:     ', row.id);
console.log('  cohortId:  ', row.cohort_id);
console.log('  expires:   ', new Date(payload.exp * 1000).toISOString());
console.log('');
console.log('Test URL (open in browser):');
console.log(url);
