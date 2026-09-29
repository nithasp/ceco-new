import db from '../database';
import { Locale } from '../types/common.types';
import { Queryable, Row } from '../types/database.types';
import {
  NewRecruitment,
  Recruitment,
  RecruitmentFilters,
  RecruitmentUpdate,
} from '../types/recruitment.types';
import { requireRow } from '../utils/rows';

export class RecruitmentRepository {
  async index(filters: RecruitmentFilters, runner: Queryable = db): Promise<Recruitment[]> {
    const params: unknown[] = [];
    const { rows } = await runner.query(
      `SELECT * FROM recruitments${where(filters, params)} ORDER BY priority ASC, id ASC`,
      params,
    );
    return rows.map(toRecruitment);
  }

  async count(filters: RecruitmentFilters, runner: Queryable = db): Promise<number> {
    const params: unknown[] = [];
    const { rows } = await runner.query(
      `SELECT COUNT(*) AS count FROM recruitments${where(filters, params)}`,
      params,
    );
    return Number(rows[0]?.count ?? 0);
  }

  async show(id: number, runner: Queryable = db): Promise<Recruitment | null> {
    const { rows } = await runner.query('SELECT * FROM recruitments WHERE id = ?', [id]);
    return rows[0] ? toRecruitment(rows[0]) : null;
  }

  async create(input: NewRecruitment, runner: Queryable = db): Promise<Recruitment> {
    const priority = input.priority ?? (await this.nextPriority(input.locale, runner));
    const { insertId } = await runner.query(
      `INSERT INTO recruitments (position, description, amount, priority, locale, is_published)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.position,
        input.description ?? null,
        input.amount ?? null,
        priority,
        input.locale,
        input.isPublished ?? true,
      ],
    );
    const created = await this.show(insertId, runner);
    return requireRow(created ? [created] : [], 'INSERT INTO recruitments');
  }

  async update(id: number, changes: RecruitmentUpdate, runner: Queryable = db): Promise<Recruitment | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (changes.position !== undefined) {
      fields.push('position = ?');
      values.push(changes.position);
    }
    if (changes.description !== undefined) {
      fields.push('description = ?');
      values.push(changes.description);
    }
    if (changes.amount !== undefined) {
      fields.push('amount = ?');
      values.push(changes.amount);
    }
    if (changes.priority !== undefined) {
      fields.push('priority = ?');
      values.push(changes.priority);
    }
    if (changes.locale !== undefined) {
      fields.push('locale = ?');
      values.push(changes.locale);
    }
    if (changes.isPublished !== undefined) {
      fields.push('is_published = ?');
      values.push(changes.isPublished);
    }
    if (!fields.length) return this.show(id, runner);

    values.push(id);
    const { rowCount } = await runner.query(
      `UPDATE recruitments SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
    return rowCount > 0 ? this.show(id, runner) : null;
  }

  async delete(id: number, runner: Queryable = db): Promise<boolean> {
    const { rowCount } = await runner.query('DELETE FROM recruitments WHERE id = ?', [id]);
    return rowCount > 0;
  }

  async nextPriority(locale: Locale, runner: Queryable = db): Promise<number> {
    const { rows } = await runner.query(
      'SELECT COALESCE(MAX(priority), -1) + 1 AS next FROM recruitments WHERE locale = ?',
      [locale],
    );
    return Number(rows[0]?.next ?? 0);
  }

  async setOrder(locale: Locale, ids: number[], runner: Queryable = db): Promise<void> {
    for (const [index, id] of ids.entries()) {
      await runner.query('UPDATE recruitments SET priority = ? WHERE id = ? AND locale = ?', [
        index,
        id,
        locale,
      ]);
    }
  }
}

function where(filters: RecruitmentFilters, params: unknown[]): string {
  const conditions: string[] = [];
  if (filters.locale) {
    conditions.push('locale = ?');
    params.push(filters.locale);
  }
  if (!filters.includeUnpublished) conditions.push('is_published = 1');
  return conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
}

function toRecruitment(row: Row): Recruitment {
  return {
    id: Number(row.id),
    position: row.position as string,
    description: (row.description as string | null) ?? null,
    amount: row.amount === null || row.amount === undefined ? null : Number(row.amount),
    priority: Number(row.priority),
    locale: row.locale as Locale,
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}
