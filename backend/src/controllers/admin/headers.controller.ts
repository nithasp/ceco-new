import { Request, Response } from 'express';
import { idParams, reorderSchema } from '../../schemas/common.schema';
import {
  headerSlideUpdateSchema,
  headerUpdateSchema,
  newHeaderSchema,
  newHeaderSlideSchema,
} from '../../schemas/header.schema';
import { headerService } from '../../services';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { parse } from '../../utils/validation';

export const index = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await headerService.listHeaders(), 'Headers fetched.');
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await headerService.requireHeader(id), 'Header fetched.');
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = parse(newHeaderSchema, req.body);
  sendSuccess(res, await headerService.createHeader(input), 'Header created.', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const changes = parse(headerUpdateSchema, req.body);
  sendSuccess(res, await headerService.updateHeader(id, changes), 'Header updated.');
});

export const destroy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await headerService.deleteHeader(id), 'Header deleted.');
});

// ---- slides ---------------------------------------------------------------

export const addSlide = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const input = parse(newHeaderSlideSchema, req.body);
  sendSuccess(res, await headerService.addSlide(id, input), 'Slide added.', 201);
});

export const reorderSlides = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const { ids } = parse(reorderSchema, req.body);
  sendSuccess(res, await headerService.reorderSlides(id, ids), 'Slides reordered.');
});

export const updateSlide = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const changes = parse(headerSlideUpdateSchema, req.body);
  sendSuccess(res, await headerService.updateSlide(id, changes), 'Slide updated.');
});

export const destroySlide = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await headerService.deleteSlide(id), 'Slide deleted.');
});
