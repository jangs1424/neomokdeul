#!/usr/bin/env node
/**
 * Replace every applicant's photo_file_url with a real face photo from
 * randomuser.me (gender-appropriate), uploaded to Supabase Storage as JPG.
 *
 * Usage: node packages/db/scripts/regen-photos.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');

try {
  const raw = await readFile(resolve(repoRoot, '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: apps, error } = await sb
  .from('applications')
  .select('id, name, gender, photo_file_url')
  .order('created_at', { ascending: true });
if (error) { console.error(error); process.exit(1); }

console.log(`regenerating photo for ${apps.length} apps`);

let i = 0;
let menIdx = 10; // start at 10 to avoid duplicate-looking faces
let womenIdx = 20;

for (const app of apps) {
  i++;
  const idx = app.gender === 'male' ? menIdx++ : womenIdx++;
  const folder = app.gender === 'male' ? 'men' : 'women';
  const srcUrl = `https://randomuser.me/api/portraits/${folder}/${idx % 99}.jpg`;

  try {
    const response = await fetch(srcUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status} from randomuser.me`);
    const arr = await response.arrayBuffer();
    const buf = Buffer.from(arr);

    const path = `${Date.now()}-${randomUUID()}.jpg`;
    const { error: ue } = await sb.storage
      .from('photos')
      .upload(path, buf, { contentType: 'image/jpeg' });
    if (ue) throw new Error(`upload: ${ue.message}`);

    // delete old file if it exists and is different
    if (app.photo_file_url && app.photo_file_url !== path && /\.(svg|jpg|jpeg|png|webp)$/i.test(app.photo_file_url)) {
      await sb.storage.from('photos').remove([app.photo_file_url]);
    }

    const { error: re } = await sb
      .from('applications')
      .update({ photo_file_url: path })
      .eq('id', app.id);
    if (re) throw new Error(`db update: ${re.message}`);

    console.log(`  ${i.toString().padStart(2)}/${apps.length}  ${app.name}  ${folder}/${idx}  ${buf.length} bytes`);
  } catch (err) {
    console.error(`  ✗ ${app.name}: ${err.message}`);
  }
}

console.log('✓ done');
