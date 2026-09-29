import { NextFunction, Request, Response } from 'express';
import { auditService } from '../services';
import {
  AuditAction,
  AuditAnnotation,
  AuditDetails,
  AuditDetailsFn,
  AuditRule,
  NewAuditLog,
} from '../types/auditLog.types';
import { requestSource } from '../utils/request';

const METHOD_ACTIONS: Record<string, AuditAction> = {
  GET: 'READ',
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

const UNNAMED_EVENT = 'api.request';

const MAX_DETAIL_LENGTH = 100;

// A row keeps small, non-secret facts only: ids, names, locales, published flags. Never a password,
// a token or a whole request body.

function safeValue(val: unknown): string | number | boolean | undefined {
  if (typeof val === 'number') return Number.isFinite(val) ? val : undefined;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string' && val.trim()) return val.trim().slice(0, MAX_DETAIL_LENGTH);
  return undefined;
}

const bodyOf = (req: Request): Record<string, unknown> =>
  req.body && typeof req.body === 'object' && !Array.isArray(req.body)
    ? (req.body as Record<string, unknown>)
    : {};

function copy(source: Record<string, unknown>, keys: string[]): AuditDetails | undefined {
  const details: AuditDetails = {};
  for (const key of keys) {
    const val = safeValue(source[key]);
    if (val !== undefined) details[key] = val;
  }
  return Object.keys(details).length ? details : undefined;
}

const pick =
  (...keys: string[]): AuditDetailsFn =>
  (req) =>
    copy(bodyOf(req), keys);

const fromQuery =
  (...keys: string[]): AuditDetailsFn =>
  (req) =>
    copy(req.query as Record<string, unknown>, keys);

// Names the fields an update sent, never their values: a body can carry long rich text
const changed =
  (...keys: string[]): AuditDetailsFn =>
  (req) => {
    const body = bodyOf(req);
    const fields = keys.filter((key) => body[key] !== undefined);
    return fields.length ? { changed: fields } : undefined;
  };

const itemCount =
  (field: string): AuditDetailsFn =>
  (req) => {
    const items: unknown = bodyOf(req)[field];
    return Array.isArray(items) ? { items: items.length } : undefined;
  };

const SLIDE_FIELDS = ['title', 'description', 'imageId', 'position', 'isPublished'];
const PROJECT_FIELDS = ['name', 'description', 'locale', 'imageId', 'position', 'isPublished'];
const JOB_FIELDS = ['position', 'description', 'amount', 'priority', 'locale', 'isPublished'];
const DOCUMENT_FIELDS = ['name', 'description', 'locale', 'fileId', 'position', 'isPublished'];
const MEDIA_FIELDS = ['name', 'alternativeText', 'caption'];

const rule = (method: string, route: string, event: string | null, details?: AuditDetailsFn): AuditRule => ({
  method,
  pattern: new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}/?$`, 'i'),
  event,
  details,
});

const RULES: AuditRule[] = [
  rule('PATCH', '/users/me', 'user.updated', changed('firstName', 'lastName', 'username')),
  rule('PUT', '/users/me/password', 'user.password_changed'),

  rule('POST', '/admin/media', 'media.uploaded', pick('name', 'alternativeText')),
  rule('GET', '/admin/media', 'admin.media_list_viewed', fromQuery('search', 'mimeGroup')),
  rule('GET', '/admin/media/:id', null),
  rule('PATCH', '/admin/media/:id', 'media.updated', changed(...MEDIA_FIELDS)),
  rule('DELETE', '/admin/media/:id', 'media.deleted', fromQuery('force')),

  rule('GET', '/admin/headers', 'admin.headers_viewed'),
  rule('GET', '/admin/headers/:id', null),
  rule('POST', '/admin/headers', 'header.created', pick('name', 'locale')),
  rule('PATCH', '/admin/headers/:id', 'header.updated', changed('name')),
  rule('DELETE', '/admin/headers/:id', 'header.deleted'),
  rule('POST', '/admin/headers/:id/slides', 'header.slide_added', pick('title', 'imageId')),
  rule('PUT', '/admin/headers/:id/slides/order', 'header.slides_reordered', itemCount('ids')),
  rule('PATCH', '/admin/header-slides/:id', 'header.slide_updated', changed(...SLIDE_FIELDS)),
  rule('DELETE', '/admin/header-slides/:id', 'header.slide_deleted'),

  rule('GET', '/admin/recent-projects', 'admin.recent_projects_viewed', fromQuery('locale')),
  rule('GET', '/admin/recent-projects/:id', null),
  rule('POST', '/admin/recent-projects', 'recent_project.created', pick('name', 'locale')),
  rule('PUT', '/admin/recent-projects/order', 'recent_project.reordered', itemCount('ids')),
  rule('PATCH', '/admin/recent-projects/:id', 'recent_project.updated', changed(...PROJECT_FIELDS)),
  rule('DELETE', '/admin/recent-projects/:id', 'recent_project.deleted'),

  rule('GET', '/admin/experiences', 'admin.experiences_viewed', fromQuery('locale', 'type')),
  rule('GET', '/admin/experiences/:id', null),
  rule('POST', '/admin/experiences', 'experience.created', pick('type', 'locale')),
  rule('PATCH', '/admin/experiences/:id', 'experience.updated', changed('type', 'position')),
  rule('DELETE', '/admin/experiences/:id', 'experience.deleted'),
  rule('POST', '/admin/experiences/:id/companies', 'experience.company_added', pick('name')),
  rule('PUT', '/admin/experiences/:id/companies/order', 'experience.companies_reordered', itemCount('ids')),
  rule('PATCH', '/admin/experience-companies/:id', 'experience.company_updated', changed('name', 'position')),
  rule('DELETE', '/admin/experience-companies/:id', 'experience.company_deleted'),
  rule('POST', '/admin/experience-companies/:id/works', 'experience.work_added', pick('description', 'year')),
  rule('PUT', '/admin/experience-companies/:id/works/order', 'experience.works_reordered', itemCount('ids')),
  rule('PATCH', '/admin/experience-works/:id', 'experience.work_updated', changed('description', 'year')),
  rule('DELETE', '/admin/experience-works/:id', 'experience.work_deleted'),

  rule('GET', '/admin/recruitments', 'admin.recruitments_viewed', fromQuery('locale')),
  rule('GET', '/admin/recruitments/:id', null),
  rule('POST', '/admin/recruitments', 'recruitment.created', pick('position', 'locale')),
  rule('PUT', '/admin/recruitments/order', 'recruitment.reordered', itemCount('ids')),
  rule('PATCH', '/admin/recruitments/:id', 'recruitment.updated', changed(...JOB_FIELDS)),
  rule('DELETE', '/admin/recruitments/:id', 'recruitment.deleted'),

  rule('GET', '/admin/documents', 'admin.documents_viewed', fromQuery('kind', 'locale')),
  rule('GET', '/admin/documents/:id', null),
  rule('POST', '/admin/documents', 'document.created', pick('kind', 'name')),
  rule('PATCH', '/admin/documents/:id', 'document.updated', changed(...DOCUMENT_FIELDS)),
  rule('DELETE', '/admin/documents/:id', 'document.deleted'),

  rule('GET', '/admin/audit-logs', 'admin.audit_log_viewed'),
];

const findRule = (method: string, path: string): AuditRule | undefined =>
  RULES.find((r) => r.method === method && r.pattern.test(path));

export const auditAs = (res: Response, annotation: AuditAnnotation): void => {
  res.locals.audit = annotation;
};

function fromAnnotation(req: Request, annotation: AuditAnnotation): NewAuditLog {
  return {
    ...annotation,
    userId: annotation.userId ?? req.user?.userId ?? null,
    userRole: annotation.userRole ?? req.user?.role ?? null,
  };
}

// A read the table does not name is left out: the public content routes would otherwise write a row
// for every visitor. A write without a rule is still recorded, so nothing slips past unlogged.
function fromRoute(req: Request, path: string): NewAuditLog | null {
  const action = METHOD_ACTIONS[req.method];
  if (!req.user || !action) return null;

  const matched = findRule(req.method, path);
  if (matched?.event === null) return null;
  if (!matched && action === 'READ') return null;

  return {
    userId: req.user.userId,
    userRole: req.user.role,
    action,
    event: matched?.event ?? UNNAMED_EVENT,
    details: matched?.details?.(req),
  };
}

export const recordActivity = (req: Request, res: Response, next: NextFunction): void => {
  const path = req.path;

  res.on('finish', () => {
    const annotation = res.locals.audit as AuditAnnotation | undefined;
    const entry = annotation ? fromAnnotation(req, annotation) : fromRoute(req, path);
    if (entry) auditService.recordEvent({ ...requestSource(req), statusCode: res.statusCode, ...entry });
  });
  next();
};
