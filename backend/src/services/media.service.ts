import { imageSize } from 'image-size';
import { config } from '../config';
import { logger } from '../logger';
import { Media, MediaFilters, MediaUpdate, UploadMeta, UploadedFile } from '../types/media.types';
import { Page, Pagination } from '../types/pagination.types';
import { MediaServiceDeps } from '../types/service.types';
import { AppError } from '../utils/errors';
import { extensionFor, hasPixelSize, isAllowedUpload } from '../utils/mimeTypes';
import { baseName, objectKeyFor } from '../utils/objectKey';
import { pageOf } from '../utils/paging';

const notFound = (id: number) => new AppError(`file with id ${id} not found`, 404, 'not_found');

function measure(buffer: Buffer, mime: string): { width: number | null; height: number | null } {
  if (!hasPixelSize(mime)) return { width: null, height: null };
  try {
    const size = imageSize(buffer);
    return { width: size.width ?? null, height: size.height ?? null };
  } catch (err) {
    // A size that cannot be read is not a reason to refuse the file; the CMS just shows no dimensions
    logger.warn({ err, mime }, 'could not read image dimensions');
    return { width: null, height: null };
  }
}

export function createMediaService({ media, storage }: MediaServiceDeps) {
  function findMedia(id: number): Promise<Media | null> {
    return media.show(id);
  }

  async function requireMedia(id: number): Promise<Media> {
    const found = await findMedia(id);
    if (!found) throw notFound(id);
    return found;
  }

  return {
    findMedia,
    requireMedia,

    listMedia(filters: MediaFilters, page: Pagination): Promise<Page<Media>> {
      return pageOf(
        () => media.index(filters, page),
        () => media.count(filters),
      );
    },

    // The file reaches storage first: a row that pointed at an object which was never written would
    // render as a broken image with no way to tell from the database
    async upload(file: UploadedFile, meta: UploadMeta = {}): Promise<Media> {
      if (!isAllowedUpload(file.mime)) {
        throw new AppError(`${file.mime} files are not accepted here`, 415, 'unsupported_media_type');
      }
      if (file.size > config.storage.maxUploadBytes) {
        throw new AppError(
          `The file is larger than the ${config.storage.maxUploadMb} MB limit`,
          413,
          'payload_too_large',
        );
      }

      const ext = extensionFor(file.mime);
      const key = objectKeyFor(file.originalName, ext, config.storage.r2.prefix);
      const { width, height } = measure(file.buffer, file.mime);

      const stored = await storage.put({ key, body: file.buffer, mime: file.mime });

      try {
        return await media.create({
          key: stored.key,
          url: stored.url,
          name: meta.name ?? baseName(file.originalName) ?? file.originalName,
          alternativeText: meta.alternativeText ?? null,
          caption: meta.caption ?? null,
          mime: file.mime,
          ext,
          size: file.size,
          width,
          height,
          provider: storage.provider,
        });
      } catch (err) {
        // The row failed, so the object has nothing pointing at it; leaving it would be a silent leak
        await storage.remove(stored.key).catch((removeErr: unknown) => {
          logger.error({ err: removeErr, key: stored.key }, 'could not clean up an orphaned upload');
        });
        throw err;
      }
    },

    async updateMedia(id: number, changes: MediaUpdate): Promise<Media> {
      const updated = await media.update(id, changes);
      if (!updated) throw notFound(id);
      return updated;
    },

    // A file still shown somewhere on the site is refused unless the caller says to go ahead, in
    // which case the slide or document keeps its row and simply loses the picture
    async deleteMedia(id: number, force = false): Promise<Media> {
      const existing = await requireMedia(id);

      if (!force) {
        const references = await media.countReferences(id);
        if (references > 0) {
          throw new AppError(
            `This file is used by ${references} item${references === 1 ? '' : 's'} on the site. ` +
              'Replace it there first, or confirm to remove it anyway.',
            409,
            'conflict',
          );
        }
      }

      const removed = await media.delete(id);
      if (!removed) throw notFound(id);

      await storage.remove(existing.key);
      return existing;
    },
  };
}

export type MediaService = ReturnType<typeof createMediaService>;
