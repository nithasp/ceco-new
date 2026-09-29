import { z } from 'zod';
import { AUDIT_ACTIONS, AUDIT_RESULTS } from '../types/auditLog.types';
import { positiveInt, searchText } from './common.schema';

const actionSchema = z.enum(AUDIT_ACTIONS, `must be one of ${AUDIT_ACTIONS.join(', ')}`);

// ?action=LOGIN or ?action=LOGIN,LOGOUT both work
const actionList = z
  .union([actionSchema, z.array(actionSchema), z.string()])
  .transform((value) => (typeof value === 'string' ? value.split(',').map((part) => part.trim()) : value))
  .transform((value) => (Array.isArray(value) ? value : [value]))
  .pipe(z.array(actionSchema).min(1).max(AUDIT_ACTIONS.length))
  .optional();

const timestamp = z
  .string()
  .transform((value) => new Date(value))
  .refine((date) => !Number.isNaN(date.getTime()), { error: 'must be a date such as 2024-01-31' })
  .optional();

export const auditLogFiltersSchema = z.object({
  userId: positiveInt.optional(),
  username: searchText,
  actions: actionList,
  result: z.enum(AUDIT_RESULTS, `must be one of ${AUDIT_RESULTS.join(', ')}`).optional(),
  from: timestamp,
  to: timestamp,
});
