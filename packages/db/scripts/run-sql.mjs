#!/usr/bin/env node
/**
 * Run a SQL file against the Supabase Postgres DB using direct connection.
 *
 * Usage:
 *   node packages/db/scripts/run-sql.mjs packages/db/supabase/migrations/0006_foo.sql
 *   node packages/db/scripts/run-sql.mjs -          # (read from stdin)
 *   node packages/db/scripts/run-sql.mjs --check    # (connection test: SELECT 1)
 *
 * Env (auto-loaded from repo-root `.env.local`):
 *   SUPABASE_DB_HOST, SUPABASE_DB_PORT, SUPABASE_DB_NAME,
 *   SUPABASE_DB_USER, SUPABASE_DB_PASSWORD
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');

// Load .env.local manually (no dotenv dep needed)
try {
  const raw = await readFile(resolve(repoRoot, '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* .env.local optional — env may be set by caller */
}

const cfg = {
  host: process.env.SUPABASE_DB_HOST,
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  user: process.env.SUPABASE_DB_USER || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
};

if (!cfg.host || !cfg.password) {
  console.error('✗ Missing SUPABASE_DB_HOST or SUPABASE_DB_PASSWORD in .env.local');
  process.exit(1);
}

const arg = process.argv[2];

async function run() {
  const client = new pg.Client(cfg);
  await client.connect();

  if (!arg || arg === '--check') {
    const { rows } = await client.query('select now() as now, version()');
    console.log('✓ connection ok');
    console.log('  now:', rows[0].now);
    console.log('  version:', rows[0].version.split(' on ')[0]);
    await client.end();
    return;
  }

  let sql;
  if (arg === '-') {
    sql = await new Promise((res) => {
      let data = '';
      process.stdin.on('data', (c) => (data += c));
      process.stdin.on('end', () => res(data));
    });
  } else {
    const path = resolve(repoRoot, arg);
    sql = await readFile(path, 'utf8');
    console.log('→ running', path);
  }

  try {
    await client.query(sql);
    console.log('✓ success');
  } catch (err) {
    console.error('✗ sql error:', err.message);
    if (err.position) console.error('  position:', err.position);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('✗ fatal:', err.message);
  process.exit(1);
});
