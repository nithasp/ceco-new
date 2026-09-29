import { Request, Response } from 'express';
import { idParams, localeQuery, reorderSchema } from '../../schemas/common.schema';
import {
  newRecentProjectSchema,
  recentProjectFiltersSchema,
  recentProjectUpdateSchema,
} from '../../schemas/recentProject.schema';
import { recentProjectService } from '../../services';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { parse } from '../../utils/validation';

// Unlike the public route this returns drafts too, so the CMS can show what is not live yet
export const index = asyncHandler(async (req: Request, res: Response) => {
  const filters = parse(recentProjectFiltersSchema, req.query);
  sendSuccess(res, await recentProjectService.listAll(filters), 'Recent projects fetched.');
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await recentProjectService.getProject(id), 'Recent project fetched.');
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = parse(newRecentProjectSchema, req.body);
  sendSuccess(res, await recentProjectService.createProject(input), 'Recent project created.', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const changes = parse(recentProjectUpdateSchema, req.body);
  sendSuccess(res, await recentProjectService.updateProject(id, changes), 'Recent project updated.');
});

export const destroy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await recentProjectService.deleteProject(id), 'Recent project deleted.');
});

// The order is per language, so the locale is part of the request rather than inferred
export const reorder = asyncHandler(async (req: Request, res: Response) => {
  const { locale } = parse(localeQuery, req.query);
  const { ids } = parse(reorderSchema, req.body);
  sendSuccess(res, await recentProjectService.reorder(locale, ids), 'Recent projects reordered.');
});
