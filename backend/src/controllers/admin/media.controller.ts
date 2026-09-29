import { Request, Response } from 'express';
import { requireFile } from '../../middleware/upload';
import { idParams, paginationSchema } from '../../schemas/common.schema';
import {
  mediaDeleteQuery,
  mediaFiltersSchema,
  mediaUpdateSchema,
  uploadMetaSchema,
} from '../../schemas/media.schema';
import { mediaService } from '../../services';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { parse } from '../../utils/validation';

export const index = asyncHandler(async (req: Request, res: Response) => {
  const filters = parse(mediaFiltersSchema, req.query);
  const page = parse(paginationSchema, req.query);
  const { items, total } = await mediaService.listMedia(filters, page);
  sendSuccess(res, items, 'Files fetched.', 200, { ...page, total });
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await mediaService.requireMedia(id), 'File fetched.');
});

// multer has already put the file on the request and checked its declared type and size
export const upload = asyncHandler(async (req: Request, res: Response) => {
  const file = requireFile(req);
  const meta = parse(uploadMetaSchema, req.body ?? {});
  sendSuccess(res, await mediaService.upload(file, meta), 'File uploaded.', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const changes = parse(mediaUpdateSchema, req.body);
  sendSuccess(res, await mediaService.updateMedia(id, changes), 'File updated.');
});

// ?force=true removes a file that is still in use; the slides pointing at it keep their row and
// lose the picture
export const destroy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const { force } = parse(mediaDeleteQuery, req.query);
  sendSuccess(res, await mediaService.deleteMedia(id, force), 'File deleted.');
});
