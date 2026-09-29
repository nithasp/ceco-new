import { Request, Response } from 'express';
import { idParams } from '../../schemas/common.schema';
import {
  documentFiltersSchema,
  documentUpdateSchema,
  newDocumentSchema,
} from '../../schemas/document.schema';
import { documentService } from '../../services';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { parse } from '../../utils/validation';

// Covers both the company-profile PDF and the site logo; ?kind= narrows it to one
export const index = asyncHandler(async (req: Request, res: Response) => {
  const filters = parse(documentFiltersSchema, req.query);
  sendSuccess(res, await documentService.listAll(filters), 'Documents fetched.');
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await documentService.getDocument(id), 'Document fetched.');
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = parse(newDocumentSchema, req.body);
  sendSuccess(res, await documentService.createDocument(input), 'Document created.', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  const changes = parse(documentUpdateSchema, req.body);
  sendSuccess(res, await documentService.updateDocument(id, changes), 'Document updated.');
});

export const destroy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = parse(idParams, req.params);
  sendSuccess(res, await documentService.deleteDocument(id), 'Document deleted.');
});
