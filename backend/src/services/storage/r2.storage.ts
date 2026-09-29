import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from '../../config';
import { logger } from '../../logger';
import { PutObject, StorageDriver, StoredObject } from '../../types/storage.types';
import { AppError } from '../../utils/errors';
import { isSafeKey } from '../../utils/objectKey';

const ONE_YEAR_SECONDS = 31_536_000;

// R2 speaks the S3 API, so the standard client works against it. 'auto' is the only region R2
// accepts, and the endpoint is per account.
export function createR2Storage(): StorageDriver {
  const { accountId, accessKeyId, secretAccessKey, bucket, publicUrl, endpoint } = config.storage.r2;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      '[storage] R2 is selected but R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY or R2_BUCKET is missing',
    );
  }

  // Without a public hostname the uploaded URL would point nowhere a browser can reach, and every
  // image on the site would break silently
  if (!publicUrl) {
    logger.warn(
      'R2_PUBLIC_URL is not set: uploaded files will be stored but their URLs will not be publicly reachable. ' +
        'Enable the bucket r2.dev subdomain or connect a custom domain, then set R2_PUBLIC_URL.',
    );
  }

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  const base = publicUrl ?? `${endpoint}/${bucket}`;

  return {
    provider: 'r2',

    async put({ key, body, mime }: PutObject): Promise<StoredObject> {
      if (!isSafeKey(key)) throw new AppError('That file name is not allowed', 400, 'invalid_request');

      try {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: mime,
            // Every key carries a random suffix, so an object is never replaced and may be cached
            // for as long as the browser likes
            CacheControl: `public, max-age=${ONE_YEAR_SECONDS}, immutable`,
          }),
        );
      } catch (err) {
        logger.error({ err, key }, 'R2 upload failed');
        throw new AppError('The file could not be stored. Please try again.', 502, 'storage_error');
      }

      return { key, url: this.urlFor(key) };
    },

    async remove(key: string): Promise<void> {
      if (!isSafeKey(key)) throw new AppError('That file name is not allowed', 400, 'invalid_request');

      try {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      } catch (err) {
        // The row is still removed: a leftover object costs storage, a dangling row breaks a page
        logger.error({ err, key }, 'R2 delete failed');
      }
    },

    urlFor(key: string): string {
      return `${base}/${key}`;
    },
  };
}
