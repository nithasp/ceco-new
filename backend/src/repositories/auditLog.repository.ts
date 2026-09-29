import db from '../database';
import { AuditAction, AuditDetails, AuditLog, AuditLogFilters, NewAuditLog } from '../types/auditLog.types';
import { Queryable, Row } from '../types/database.types';
import { Pagination } from '../types/pagination.types';
import { UserRole } from '../types/user.types';
import { clip } from '../utils/text';

export class AuditLogRepository {
  async create(entry: NewAuditLog, runner: Queryable = db): Promise<void> {
    await runner.query(
      `INSERT INTO audit_logs
         (user_id, username, user_role, action, event, method, path, status_code, ip_address, user_agent, details)
       VALUES (
         COALESCE(?, (SELECT id FROM users WHERE username = ?)),
         COALESCE(?, (SELECT username FROM users WHERE id = ?)),
         ?, ?, ?, ?, ?, ?, ?, ?, ?
       )`,
      [
        entry.userId ?? null,
        clip(entry.username, 100),
        clip(entry.username, 100),
        entry.userId ?? null,
        entry.userRole ?? null,
        entry.action,
        clip(entry.event, 60),
        clip(entry.method, 10),
        clip(entry.path, 255),
        entry.statusCode ?? null,
        clip(entry.ipAddress, 45),
        clip(entry.userAgent, 255),
        entry.details ? JSON.stringify(entry.details) : null,
      ],
    );
  }

  async index(filters: AuditLogFilters, page: Pagination, runner: Queryable = db): Promise<AuditLog[]> {
    const params: unknown[] = [];
    const sql = `SELECT * FROM audit_logs${where(filters, params)}
                 ORDER BY created_at DESC, id DESC
                 LIMIT ? OFFSET ?`;
    params.push(page.limit, page.offset);
    const { rows } = await runner.query(sql, params);
    return rows.map(toAuditLog);
  }

  async count(filters: AuditLogFilters, runner: Queryable = db): Promise<number> {
    const params: unknown[] = [];
    const { rows } = await runner.query(
      `SELECT COUNT(*) AS count FROM audit_logs${where(filters, params)}`,
      params,
    );
    return Number(rows[0]?.count ?? 0);
  }

  async deleteOlderThan(days: number, runner: Queryable = db): Promise<number> {
    const { rowCount } = await runner.query(
      'DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days],
    );
    return rowCount;
  }
}

function where(filters: AuditLogFilters, params: unknown[]): string {
  const conditions: string[] = [];
  if (filters.userId) {
    conditions.push('user_id = ?');
    params.push(filters.userId);
  }
  if (filters.username) {
    conditions.push('LOCATE(?, LOWER(username)) > 0');
    params.push(filters.username.toLowerCase());
  }
  if (filters.actions?.length) {
    // The driver expands the array into the IN list, still as bound values
    conditions.push('action IN (?)');
    params.push(filters.actions);
  }
  if (filters.result === 'success') conditions.push('status_code < 400');
  if (filters.result === 'failure') conditions.push('status_code >= 400');
  if (filters.from) {
    conditions.push('created_at >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push('created_at < ?');
    params.push(filters.to);
  }
  return conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
}

function toAuditLog(row: Row): AuditLog {
  return {
    id: Number(row.id),
    createdAt: row.created_at as Date,
    userId: row.user_id === null || row.user_id === undefined ? null : Number(row.user_id),
    username: (row.username as string | null) ?? null,
    userRole: (row.user_role as UserRole | null) ?? null,
    action: row.action as AuditAction,
    event: row.event as string,
    method: (row.method as string | null) ?? null,
    path: (row.path as string | null) ?? null,
    statusCode: row.status_code === null || row.status_code === undefined ? null : Number(row.status_code),
    ipAddress: (row.ip_address as string | null) ?? null,
    userAgent: (row.user_agent as string | null) ?? null,
    details: parseDetails(row.details),
  };
}

// A JSON column comes back parsed, but a plain text column would not, so both are handled
function parseDetails(value: unknown): AuditDetails | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value as AuditDetails;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value) as AuditDetails;
  } catch {
    return null;
  }
}
