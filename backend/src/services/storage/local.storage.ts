import fs from 'fs/promises';
import path from 'path';
import { config } from '../../config';
import { PutObject, StorageDriver, StoredObject } from '../../types/storage.types';
import { AppError } from '../../utils/errors';
import { isSafeKey } from '../../utils/objectKey';

const ROOT = path.resolve(process.cwd(), config.storage.uploadDir);

// The key is validated, then the resolved path is checked against the upload root as well, so
// neither a crafted key nor a symlink can write outside it (OWASP API8)
function pathFor(key: string): string {
  if (!isSafeKey(key)) throw new AppError('That file name is not allowed', 400, 'invalid_request');

  const target = path.resolve(ROOT, key);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    throw new AppError('That file name is not allowed', 400, 'invalid_request');
  }
  return target;
}

// Keeps the site working before an R2 bucket exists: files are written under UPLOAD_DIR and served
// by the static route app.ts mounts at /uploads
export function createLocalStorage(): StorageDriver {
  return {
    provider: 'local',

    async put({ key, body }: PutObject): Promise<StoredObject> {
      const target = pathFor(key);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, body);
      return { key, url: this.urlFor(key) };
    },

    async remove(key: string): Promise<void> {
      // A file that is already gone is not an error: the row still has to be deleted
      await fs.rm(pathFor(key), { force: true });
    },

    urlFor(key: string): string {
      return `${config.publicBaseUrl}${config.storage.localUrlPath}/${key}`;
    },
  };
}
