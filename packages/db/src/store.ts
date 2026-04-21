import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Application, ApplicationInput, ApplicationStatus } from './schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const APPLICATIONS_FILE = join(DATA_DIR, 'applications.json');

async function ensureFile(): Promise<void> {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(APPLICATIONS_FILE)) await writeFile(APPLICATIONS_FILE, '[]', 'utf8');
}

export async function listApplications(): Promise<Application[]> {
  await ensureFile();
  const raw = await readFile(APPLICATIONS_FILE, 'utf8');
  return JSON.parse(raw) as Application[];
}

export async function getApplication(id: string): Promise<Application | null> {
  const apps = await listApplications();
  return apps.find((a) => a.id === id) ?? null;
}

export async function createApplication(input: ApplicationInput): Promise<Application> {
  const apps = await listApplications();
  const app: Application = {
    ...input,
    id: crypto.randomUUID(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  apps.push(app);
  await writeFile(APPLICATIONS_FILE, JSON.stringify(apps, null, 2), 'utf8');
  return app;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  note?: string,
): Promise<Application | null> {
  const apps = await listApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  apps[idx] = {
    ...apps[idx],
    status,
    note: note ?? apps[idx].note,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(APPLICATIONS_FILE, JSON.stringify(apps, null, 2), 'utf8');
  return apps[idx];
}
