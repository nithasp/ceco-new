import db from '../database';
import { Locale } from '../types/common.types';
import { Queryable, Row } from '../types/database.types';
import {
  Experience,
  ExperienceCompany,
  ExperienceCompanyUpdate,
  ExperienceFilters,
  ExperienceType,
  ExperienceUpdate,
  ExperienceWork,
  ExperienceWorkUpdate,
  NewExperience,
  NewExperienceCompany,
  NewExperienceWork,
} from '../types/experience.types';
import { requireRow } from '../utils/rows';

export class ExperienceRepository {
  async index(filters: ExperienceFilters, runner: Queryable = db): Promise<Experience[]> {
    const params: unknown[] = [];
    const { rows } = await runner.query(
      `SELECT * FROM experiences${where(filters, params)} ORDER BY position ASC, id ASC`,
      params,
    );
    return this.attachCompanies(rows.map(toExperience), runner);
  }

  async findByType(type: ExperienceType, locale: Locale, runner: Queryable = db): Promise<Experience | null> {
    const { rows } = await runner.query('SELECT * FROM experiences WHERE type = ? AND locale = ? LIMIT 1', [
      type,
      locale,
    ]);
    if (!rows[0]) return null;
    const [withCompanies] = await this.attachCompanies([toExperience(rows[0])], runner);
    return withCompanies ?? null;
  }

  async show(id: number, runner: Queryable = db): Promise<Experience | null> {
    const { rows } = await runner.query('SELECT * FROM experiences WHERE id = ?', [id]);
    if (!rows[0]) return null;
    const [withCompanies] = await this.attachCompanies([toExperience(rows[0])], runner);
    return withCompanies ?? null;
  }

  async create(input: NewExperience, runner: Queryable = db): Promise<Experience> {
    const position = input.position ?? (await this.nextPosition(input.locale, runner));
    const { insertId } = await runner.query(
      'INSERT INTO experiences (type, locale, position) VALUES (?, ?, ?)',
      [input.type, input.locale, position],
    );
    const created = await this.show(insertId, runner);
    return requireRow(created ? [created] : [], 'INSERT INTO experiences');
  }

  async update(id: number, changes: ExperienceUpdate, runner: Queryable = db): Promise<Experience | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (changes.type !== undefined) {
      fields.push('type = ?');
      values.push(changes.type);
    }
    if (changes.position !== undefined) {
      fields.push('position = ?');
      values.push(changes.position);
    }
    if (!fields.length) return this.show(id, runner);

    values.push(id);
    const { rowCount } = await runner.query(
      `UPDATE experiences SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
    return rowCount > 0 ? this.show(id, runner) : null;
  }

  async delete(id: number, runner: Queryable = db): Promise<boolean> {
    const { rowCount } = await runner.query('DELETE FROM experiences WHERE id = ?', [id]);
    return rowCount > 0;
  }

  async nextPosition(locale: Locale, runner: Queryable = db): Promise<number> {
    const { rows } = await runner.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM experiences WHERE locale = ?',
      [locale],
    );
    return Number(rows[0]?.next ?? 0);
  }

  // ---- companies ----------------------------------------------------------

  async findCompany(id: number, runner: Queryable = db): Promise<ExperienceCompany | null> {
    const { rows } = await runner.query('SELECT * FROM experience_companies WHERE id = ?', [id]);
    if (!rows[0]) return null;
    const company = toCompany(rows[0]);
    return { ...company, works: await this.listWorks(company.id, runner) };
  }

  async companyExperienceId(id: number, runner: Queryable = db): Promise<number | null> {
    const { rows } = await runner.query('SELECT experience_id FROM experience_companies WHERE id = ?', [id]);
    return rows[0] ? Number(rows[0].experience_id) : null;
  }

  async createCompany(
    experienceId: number,
    input: NewExperienceCompany,
    runner: Queryable = db,
  ): Promise<ExperienceCompany> {
    const position = input.position ?? (await this.nextCompanyPosition(experienceId, runner));
    const { insertId } = await runner.query(
      'INSERT INTO experience_companies (experience_id, name, position) VALUES (?, ?, ?)',
      [experienceId, input.name, position],
    );
    const created = await this.findCompany(insertId, runner);
    return requireRow(created ? [created] : [], 'INSERT INTO experience_companies');
  }

  async updateCompany(
    id: number,
    changes: ExperienceCompanyUpdate,
    runner: Queryable = db,
  ): Promise<ExperienceCompany | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (changes.name !== undefined) {
      fields.push('name = ?');
      values.push(changes.name);
    }
    if (changes.position !== undefined) {
      fields.push('position = ?');
      values.push(changes.position);
    }
    if (!fields.length) return this.findCompany(id, runner);

    values.push(id);
    const { rowCount } = await runner.query(
      `UPDATE experience_companies SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
    return rowCount > 0 ? this.findCompany(id, runner) : null;
  }

  async deleteCompany(id: number, runner: Queryable = db): Promise<boolean> {
    const { rowCount } = await runner.query('DELETE FROM experience_companies WHERE id = ?', [id]);
    return rowCount > 0;
  }

  async nextCompanyPosition(experienceId: number, runner: Queryable = db): Promise<number> {
    const { rows } = await runner.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM experience_companies WHERE experience_id = ?',
      [experienceId],
    );
    return Number(rows[0]?.next ?? 0);
  }

  async setCompanyOrder(experienceId: number, ids: number[], runner: Queryable = db): Promise<void> {
    for (const [index, id] of ids.entries()) {
      await runner.query('UPDATE experience_companies SET position = ? WHERE id = ? AND experience_id = ?', [
        index,
        id,
        experienceId,
      ]);
    }
  }

  // ---- works --------------------------------------------------------------

  async listWorks(companyId: number, runner: Queryable = db): Promise<ExperienceWork[]> {
    const { rows } = await runner.query(
      'SELECT * FROM experience_works WHERE company_id = ? ORDER BY position ASC, id ASC',
      [companyId],
    );
    return rows.map(toWork);
  }

  async findWork(id: number, runner: Queryable = db): Promise<ExperienceWork | null> {
    const { rows } = await runner.query('SELECT * FROM experience_works WHERE id = ?', [id]);
    return rows[0] ? toWork(rows[0]) : null;
  }

  async workCompanyId(id: number, runner: Queryable = db): Promise<number | null> {
    const { rows } = await runner.query('SELECT company_id FROM experience_works WHERE id = ?', [id]);
    return rows[0] ? Number(rows[0].company_id) : null;
  }

  async createWork(
    companyId: number,
    input: NewExperienceWork,
    runner: Queryable = db,
  ): Promise<ExperienceWork> {
    const position = input.position ?? (await this.nextWorkPosition(companyId, runner));
    const { insertId } = await runner.query(
      'INSERT INTO experience_works (company_id, description, year, position) VALUES (?, ?, ?, ?)',
      [companyId, input.description, input.year ?? null, position],
    );
    const created = await this.findWork(insertId, runner);
    return requireRow(created ? [created] : [], 'INSERT INTO experience_works');
  }

  async updateWork(
    id: number,
    changes: ExperienceWorkUpdate,
    runner: Queryable = db,
  ): Promise<ExperienceWork | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (changes.description !== undefined) {
      fields.push('description = ?');
      values.push(changes.description);
    }
    if (changes.year !== undefined) {
      fields.push('year = ?');
      values.push(changes.year);
    }
    if (changes.position !== undefined) {
      fields.push('position = ?');
      values.push(changes.position);
    }
    if (!fields.length) return this.findWork(id, runner);

    values.push(id);
    const { rowCount } = await runner.query(
      `UPDATE experience_works SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
    return rowCount > 0 ? this.findWork(id, runner) : null;
  }

  async deleteWork(id: number, runner: Queryable = db): Promise<boolean> {
    const { rowCount } = await runner.query('DELETE FROM experience_works WHERE id = ?', [id]);
    return rowCount > 0;
  }

  async nextWorkPosition(companyId: number, runner: Queryable = db): Promise<number> {
    const { rows } = await runner.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM experience_works WHERE company_id = ?',
      [companyId],
    );
    return Number(rows[0]?.next ?? 0);
  }

  async setWorkOrder(companyId: number, ids: number[], runner: Queryable = db): Promise<void> {
    for (const [index, id] of ids.entries()) {
      await runner.query('UPDATE experience_works SET position = ? WHERE id = ? AND company_id = ?', [
        index,
        id,
        companyId,
      ]);
    }
  }

  // Three queries whatever the size of the table, rather than one per company and one per work
  private async attachCompanies(experiences: Experience[], runner: Queryable): Promise<Experience[]> {
    if (!experiences.length) return experiences;

    const experienceIds = experiences.map((experience) => experience.id);
    const { rows: companyRows } = await runner.query(
      'SELECT * FROM experience_companies WHERE experience_id IN (?) ORDER BY position ASC, id ASC',
      [experienceIds],
    );
    if (!companyRows.length) return experiences;

    const companyIds = companyRows.map((row) => Number(row.id));
    const { rows: workRows } = await runner.query(
      'SELECT * FROM experience_works WHERE company_id IN (?) ORDER BY position ASC, id ASC',
      [companyIds],
    );

    const worksByCompany = new Map<number, ExperienceWork[]>();
    for (const row of workRows) {
      const companyId = Number(row.company_id);
      const list = worksByCompany.get(companyId) ?? [];
      list.push(toWork(row));
      worksByCompany.set(companyId, list);
    }

    const companiesByExperience = new Map<number, ExperienceCompany[]>();
    for (const row of companyRows) {
      const experienceId = Number(row.experience_id);
      const company = toCompany(row);
      const list = companiesByExperience.get(experienceId) ?? [];
      list.push({ ...company, works: worksByCompany.get(company.id) ?? [] });
      companiesByExperience.set(experienceId, list);
    }

    return experiences.map((experience) => ({
      ...experience,
      companies: companiesByExperience.get(experience.id) ?? [],
    }));
  }
}

function where(filters: ExperienceFilters, params: unknown[]): string {
  const conditions: string[] = [];
  if (filters.locale) {
    conditions.push('locale = ?');
    params.push(filters.locale);
  }
  if (filters.type) {
    conditions.push('type = ?');
    params.push(filters.type);
  }
  return conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
}

function toExperience(row: Row): Experience {
  return {
    id: Number(row.id),
    type: row.type as ExperienceType,
    locale: row.locale as Locale,
    position: Number(row.position),
    companies: [],
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

function toCompany(row: Row): ExperienceCompany {
  return {
    id: Number(row.id),
    name: row.name as string,
    position: Number(row.position),
    works: [],
  };
}

function toWork(row: Row): ExperienceWork {
  return {
    id: Number(row.id),
    description: row.description as string,
    year: row.year === null || row.year === undefined ? null : Number(row.year),
    position: Number(row.position),
  };
}
