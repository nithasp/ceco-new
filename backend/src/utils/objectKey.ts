import crypto from 'crypto';

const MAX_SLUG_LENGTH = 60;
const RANDOM_BYTES = 6;

// Keeps letters, digits and dashes, and folds everything else (spaces, Thai characters, quotes,
// path separators) into a dash
export function slugify(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, MAX_SLUG_LENGTH);
  return slug || 'file';
}

export function baseName(originalName: string): string {
  // Only the last segment matters, and only its stem: an uploaded name may carry a path on some
  // clients, and it must not reach the key
  const last = originalName.split(/[\\/]/).pop() ?? originalName;
  return last.replace(/\.[^.]*$/, '');
}

// The uploaded name contributes a readable slug and nothing else: the extension comes from the
// allow list the upload middleware matched, and a random suffix makes the key unguessable, so a
// crafted filename can neither escape the prefix nor overwrite an existing object (OWASP API8)
export function objectKeyFor(originalName: string, ext: string, prefix = ''): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const suffix = crypto.randomBytes(RANDOM_BYTES).toString('hex');
  const stem = slugify(baseName(originalName));

  const folder = [prefix, `${year}`, month].filter(Boolean).join('/');
  return `${folder}/${stem}-${suffix}${ext}`;
}

// A key that came back from the database is still checked before it is handed to the local driver,
// which turns it into a filesystem path (OWASP API8)
export function isSafeKey(key: string): boolean {
  if (!key || key.length > 512) return false;
  if (key.startsWith('/') || key.includes('\\')) return false;
  if (key.includes('..')) return false;
  return /^[A-Za-z0-9._\-/]+$/.test(key);
}
