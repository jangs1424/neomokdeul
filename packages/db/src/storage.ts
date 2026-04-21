import { getSupabaseAdmin } from './supabase';

/**
 * Generate a time-limited signed URL for a private Storage object.
 * Returns null if path is empty/missing or Storage errors.
 */
export async function getSignedFileUrl(
  bucket: 'voice-intros' | 'photos',
  path: string | null | undefined,
  expiresInSeconds = 3600,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await getSupabaseAdmin()
    .storage.from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}
