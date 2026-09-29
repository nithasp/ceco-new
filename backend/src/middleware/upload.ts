import { Request } from 'express';
import multer from 'multer';
import { config } from '../config';
import { UploadedFile } from '../types/media.types';
import { AppError } from '../utils/errors';
import { describeAllowedTypes, isAllowedUpload } from '../utils/mimeTypes';

// Files are held in memory rather than written to a temporary path: the only place they are meant
// to land is the bucket, and nothing is left behind when a request fails
const storage = multer.memoryStorage();

export const FILE_FIELD = 'file';

// The declared type is checked before any bytes are buffered, so a rejected upload does not spend
// memory; the service checks it again against the same list before storing anything (OWASP API4)
export const uploadSingleFile = multer({
  storage,
  limits: { fileSize: config.storage.maxUploadBytes, files: 1, fields: 10 },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedUpload(file.mimetype)) {
      callback(
        new AppError(
          `Only these file types are accepted: ${describeAllowedTypes()}`,
          415,
          'unsupported_media_type',
        ),
      );
      return;
    }
    callback(null, true);
  },
}).single(FILE_FIELD);

export function requireFile(req: Request): UploadedFile {
  const file = req.file;
  if (!file) throw new AppError(`A file is required in the '${FILE_FIELD}' field`, 400, 'invalid_request');

  return {
    originalName: file.originalname,
    buffer: file.buffer,
    mime: file.mimetype,
    size: file.size,
  };
}
