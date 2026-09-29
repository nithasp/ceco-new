import { Request, Response } from 'express';
import { idParams, reorderSchema } from '../../schemas/common.schema';
import {
  companyUpdateSchema,
  experienceFiltersSchema,
  experienceUpdateSchema,
  newCompanySchema,
  newExperienceSchema,
  newWorkSchema,
  workUpdateSchema,
} from '../../schemas/experience.schema';
import { experienceService } from '../../services';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { parse } from '../../utils/validation';

export const index = asyncHandler(async (req: Request, res: Response) => {
  const filters = parse(experienceFiltersSchema, req.query);
  sendSuccess(res, await experienceService.listAll(filters), 'Experiences fetched.');
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await experienceService.requireExperience(id), 'Experience fetched.');
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = parse(newExperienceSchema, req.body);
  sendSuccess(res, await experienceService.createExperience(input), 'Experience created.', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const changes = parse(experienceUpdateSchema, req.body);
  sendSuccess(res, await experienceService.updateExperience(id, changes), 'Experience updated.');
});

// Deleting the table takes its companies and their work rows with it, through the foreign keys
export const destroy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await experienceService.deleteExperience(id), 'Experience deleted.');
});

// ---- companies ------------------------------------------------------------

export const addCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const input = parse(newCompanySchema, req.body);
  sendSuccess(res, await experienceService.addCompany(id, input), 'Company added.', 201);
});

export const reorderCompanies = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const { ids } = parse(reorderSchema, req.body);
  sendSuccess(res, await experienceService.reorderCompanies(id, ids), 'Companies reordered.');
});

export const showCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await experienceService.requireCompany(id), 'Company fetched.');
});

export const updateCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const changes = parse(companyUpdateSchema, req.body);
  sendSuccess(res, await experienceService.updateCompany(id, changes), 'Company updated.');
});

export const destroyCompany = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await experienceService.deleteCompany(id), 'Company deleted.');
});

// ---- work rows ------------------------------------------------------------

export const addWork = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const input = parse(newWorkSchema, req.body);
  sendSuccess(res, await experienceService.addWork(id, input), 'Work item added.', 201);
});

export const reorderWorks = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const { ids } = parse(reorderSchema, req.body);
  sendSuccess(res, await experienceService.reorderWorks(id, ids), 'Work items reordered.');
});

export const updateWork = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const changes = parse(workUpdateSchema, req.body);
  sendSuccess(res, await experienceService.updateWork(id, changes), 'Work item updated.');
});

export const destroyWork = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await experienceService.deleteWork(id), 'Work item deleted.');
});
