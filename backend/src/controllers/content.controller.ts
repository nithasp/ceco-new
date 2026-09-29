import { Request, Response } from 'express';
import { localeQuery } from '../schemas/common.schema';
import { documentKindQuery } from '../schemas/document.schema';
import { experienceTypeParams } from '../schemas/experience.schema';
import {
  documentService,
  experienceService,
  headerService,
  recentProjectService,
  recruitmentService,
} from '../services';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { parse } from '../utils/validation';

// Everything here is public and read-only: this is what the website itself calls. Each route takes
// ?locale= and returns published rows only, so an unfinished draft never reaches a visitor.

export const header = asyncHandler(async (req: Request, res: Response) => {
  const { locale } = parse(localeQuery, req.query);
  sendSuccess(res, await headerService.getPublicHeader(locale), 'Header fetched.');
});

export const recentProjects = asyncHandler(async (req: Request, res: Response) => {
  const { locale } = parse(localeQuery, req.query);
  sendSuccess(res, await recentProjectService.listPublic(locale), 'Recent projects fetched.');
});

export const experiences = asyncHandler(async (req: Request, res: Response) => {
  const { locale } = parse(localeQuery, req.query);
  sendSuccess(res, await experienceService.listPublic(locale), 'Experiences fetched.');
});

export const experienceByType = asyncHandler(async (req: Request, res: Response) => {
  const { type } = parse(experienceTypeParams, req.params);
  const { locale } = parse(localeQuery, req.query);
  sendSuccess(res, await experienceService.getByType(type, locale), 'Experience fetched.');
});

export const recruitments = asyncHandler(async (req: Request, res: Response) => {
  const { locale } = parse(localeQuery, req.query);
  sendSuccess(res, await recruitmentService.listPublic(locale), 'Jobs fetched.');
});

export const documents = asyncHandler(async (req: Request, res: Response) => {
  const { kind, locale } = parse(documentKindQuery, req.query);
  sendSuccess(res, await documentService.listPublic(kind, locale), 'Documents fetched.');
});

// The footer's download button needs exactly one file, so it gets its own route rather than
// searching the list client-side
export const companyProfile = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await documentService.getCompanyProfile(), 'Company profile fetched.');
});

export const logo = asyncHandler(async (req: Request, res: Response) => {
  const { locale } = parse(localeQuery, req.query);
  sendSuccess(res, await documentService.getLogo(locale), 'Logo fetched.');
});
