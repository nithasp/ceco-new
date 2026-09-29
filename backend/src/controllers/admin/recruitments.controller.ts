import { Request, Response } from 'express';
import { idParams, localeQuery, reorderSchema } from '../../schemas/common.schema';
import {
  newRecruitmentSchema,
  recruitmentFiltersSchema,
  recruitmentUpdateSchema,
} from '../../schemas/recruitment.schema';
import { recruitmentService } from '../../services';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { parse } from '../../utils/validation';

export const index = asyncHandler(async (req: Request, res: Response) => {
  const filters = parse(recruitmentFiltersSchema, req.query);
  sendSuccess(res, await recruitmentService.listAll(filters), 'Jobs fetched.');
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await recruitmentService.getJob(id), 'Job fetched.');
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = parse(newRecruitmentSchema, req.body);
  sendSuccess(res, await recruitmentService.createJob(input), 'Job created.', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const changes = parse(recruitmentUpdateSchema, req.body);
  sendSuccess(res, await recruitmentService.updateJob(id, changes), 'Job updated.');
});

export const destroy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await recruitmentService.deleteJob(id), 'Job deleted.');
});

export const reorder = asyncHandler(async (req: Request, res: Response) => {
  const { locale } = parse(localeQuery, req.query);
  const { ids } = parse(reorderSchema, req.body);
  sendSuccess(res, await recruitmentService.reorder(locale, ids), 'Jobs reordered.');
});
