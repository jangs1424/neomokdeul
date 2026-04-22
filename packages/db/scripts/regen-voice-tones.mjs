#!/usr/bin/env node
/**
 * Replace every applicant's voice_file_url with an audible 2-second sine tone.
 * Different pitch per applicant (based on app index) so you can tell them apart.
 *
 * Usage: node packages/db/scripts/regen-voice-tones.mjs
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

/** Generate a 2-second WAV containing a sine wave at the given frequency. */
function genToneWav(freqHz, durationSec = 2) {
  const sampleRate = 22050;
  const numSamples = sampleRate * durationSec;
  const amplitude = 0.25 * 32767; // moderate volume (-12 dBFS)
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);  // PCM
  buf.writeUInt16LE(1, 22);  // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < numSamples; i++) {
    // Fade in/out to avoid clicks
    const fade = Math.min(1, i / 1000, (numSamples - i) / 1000);
    const sample = Math.sin((2 * Math.PI * freqHz * i) / sampleRate) * amplitude * fade;
    buf.writeInt16LE(Math.round(sample), 44 + i * 2);
  }
  return buf;
}

const { data: apps, error } = await sb
  .from('applications')
  .select('id, name, gender, voice_file_url')
  .order('created_at', { ascending: true });
if (error) { console.error(error); process.exit(1); }

console.log(`regenerating voice for ${apps.length} apps`);

let i = 0;
for (const app of apps) {
  i++;
  // Pitch: men 220 Hz base + variation, women 350 Hz base + variation
  const basePitch = app.gender === 'male' ? 220 : 350;
  const variation = (i % 5) * 25; // 0/25/50/75/100 Hz variation
  const freq = basePitch + variation;

  const wav = genToneWav(freq, 2);
  const path = `${Date.now()}-${randomUUID()}.wav`;

  const { error: ue } = await sb.storage
    .from('voice-intros')
    .upload(path, wav, { contentType: 'audio/wav' });
  if (ue) {
    console.error(`  ✗ ${app.name}: upload ${ue.message}`);
    continue;
  }

  // delete old file if path differs and looks valid (has / or ends with .wav/.svg)
  if (app.voice_file_url && app.voice_file_url !== path && /\.(wav|webm|mp3|ogg|m4a)$/i.test(app.voice_file_url)) {
    await sb.storage.from('voice-intros').remove([app.voice_file_url]);
  }

  const { error: re } = await sb
    .from('applications')
    .update({ voice_file_url: path })
    .eq('id', app.id);
  if (re) {
    console.error(`  ✗ ${app.name}: update ${re.message}`);
    continue;
  }
  console.log(`  ${i.toString().padStart(2)}/${apps.length}  ${app.name}  ${freq}Hz`);
}

console.log('✓ done');
