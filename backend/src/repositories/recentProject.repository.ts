import db from '../database';
import { Locale } from '../types/common.types';
import { Queryable, Row } from '../types/database.types';
import {
  NewRecentProject,
  RecentProject,
  RecentProjectFilters,
  RecentProjectUpdate,
} from '../types/recentProject.types';
import { requireRow } from '../utils/rows';

const SELECT = `SELECT p.*, m.url AS media_url, m.alternative_text AS media_alt
                FROM recent_projects p
                LEFT JOIN media m ON m.id = p.media_id`;

export class RecentProjectRepository {
  async index(filters: RecentProjectFilters, runner: Queryable = db): Promise<RecentProject[]> {
    const params: unknown[] = [];
    const { rows } = await runner.query(
      `${SELECT}${where(filters, params)} ORDER BY p.position ASC, p.id ASC`,
      params,
    );
    return rows.map(toRecentProject);
  }

  async count(filters: RecentProjectFilters, runner: Queryable = db): Promise<number> {
    const params: unknown[] = [];
    const { rows } = await runner.query(
      `SELECT COUNT(*) AS count FROM recent_projects p${where(filters, params)}`,
      params,
    );
    return Number(rows[0]?.count ?? 0);
  }

  async show(id: number, runner: Queryable = db): Promise<RecentProject | null> {
    const { rows } = await runner.query(`${SELECT} WHERE p.id = ?`, [id]);
    return rows[0] ? toRecentProject(rows[0]) : null;
  }

  async create(input: NewRecentProject, runner: Queryable = db): Promise<RecentProject> {
    const position = input.position ?? (await this.nextPosition(input.locale, runner));
    const { insertId } = await runner.query(
      `INSERT INTO recent_projects (name, description, locale, media_id, position, is_published)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.name,
        input.description ?? null,
        input.locale,
        input.imageId ?? null,
        position,
        input.isPublished ?? true,
      ],
    );
    const created = await this.show(insertId, runner);
    return requireRow(created ? [created] : [], 'INSERT INTO recent_projects');
  }

  async update(
    id: number,
    changes: RecentProjectUpdate,
    runner: Queryable = db,
  ): Promise<RecentProject | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (changes.name !== undefined) {
      fields.push('name = ?');
      values.push(changes.name);
    }
    if (changes.description !== undefined) {
      fields.push('description = ?');
      values.push(changes.description);
    }
    if (changes.locale !== undefined) {
      fields.push('locale = ?');
      values.push(changes.locale);
    }
    if (changes.imageId !== undefined) {
      fields.push('media_id = ?');
      values.push(changes.imageId);
    }
    if (changes.position !== undefined) {
      fields.push('position = ?');
      values.push(changes.position);
    }
    if (changes.isPublished !== undefined) {
      fields.push('is_published = ?');
      values.push(changes.isPublished);
    }
    if (!fields.length) return this.show(id, runner);

    values.push(id);
    const { rowCount } = await runner.query(
      `UPDATE recent_projects SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
    return rowCount > 0 ? this.show(id, runner) : null;
  }

  async delete(id: number, runner: Queryable = db): Promise<boolean> {
    const { rowCount } = await runner.query('DELETE FROM recent_projects WHERE id = ?', [id]);
    return rowCount > 0;
  }

  async nextPosition(locale: Locale, runner: Queryable = db): Promise<number> {
    const { rows } = await runner.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM recent_projects WHERE locale = ?',
      [locale],
    );
    return Number(rows[0]?.next ?? 0);
  }

  // Scoped to the locale so an id from the other language list cannot be pulled into this one
  async setOrder(locale: Locale, ids: number[], runner: Queryable = db): Promise<void> {
    for (const [index, id] of ids.entries()) {
      await runner.query('UPDATE recent_projects SET position = ? WHERE id = ? AND locale = ?', [
        index,
        id,
        locale,
      ]);
    }
  }
}

function where(filters: RecentProjectFilters, params: unknown[]): string {
  const conditions: string[] = [];
  if (filters.locale) {
    conditions.push('p.locale = ?');
    params.push(filters.locale);
  }
  if (!filters.includeUnpublished) conditions.push('p.is_published = 1');
  return conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
}

function toRecentProject(row: Row): RecentProject {
  const mediaId = row.media_id === null || row.media_id === undefined ? null : Number(row.media_id);
  return {
    id: Number(row.id),
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    locale: row.locale as Locale,
    position: Number(row.position),
    isPublished: Boolean(row.is_published),
    imageId: mediaId,
    imageUrl: (row.media_url as string | null) ?? null,
    imageAlt: (row.media_alt as string | null) ?? null,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}
