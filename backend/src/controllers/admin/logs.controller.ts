import { Request, Response } from 'express';
import { auditLogFiltersSchema } from '../../schemas/auditLog.schema';
import { paginationSchema } from '../../schemas/common.schema';
import { auditService } from '../../services';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { parse } from '../../utils/validation';

// Read-only on purpose: there is no route that edits or deletes an entry
export const auditLogs = asyncHandler(async (req: Request, res: Response) => {
  const filters = parse(auditLogFiltersSchema, req.query);
  const page = parse(paginationSchema, req.query);
  const { items, total } = await auditService.listAuditLogs(filters, page);
  sendSuccess(res, items, 'Audit log fetched.', 200, { ...page, total });
});
