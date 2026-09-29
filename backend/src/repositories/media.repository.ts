import db from '../database';
import { Queryable, Row } from '../types/database.types';
import { Media, MediaFilters, MediaUpdate, NewMedia } from '../types/media.types';
import { Pagination } from '../types/pagination.types';
import { StorageProvider } from '../types/storage.types';
import { requireRow } from '../utils/rows';

export class MediaRepository {
  async index(filters: MediaFilters, page: Pagination, runner: Queryable = db): Promise<Media[]> {
    const params: unknown[] = [];
    const sql = `SELECT * FROM media${where(filters, params)} ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(page.limit, page.offset);
    const { rows } = await runner.query(sql, params);
    return rows.map(toMedia);
  }

  async count(filters: MediaFilters, runner: Queryable = db): Promise<number> {
    const params: unknown[] = [];
    const { rows } = await runner.query(
      `SELECT COUNT(*) AS count FROM media${where(filters, params)}`,
      params,
    );
    return Number(rows[0]?.count ?? 0);
  }

  async show(id: number, runner: Queryable = db): Promise<Media | null> {
    const { rows } = await runner.query('SELECT * FROM media WHERE id = ?', [id]);
    return rows[0] ? toMedia(rows[0]) : null;
  }

  async create(input: NewMedia, runner: Queryable = db): Promise<Media> {
    const { insertId } = await runner.query(
      `INSERT INTO media
         (\`key\`, url, name, alternative_text, caption, mime, ext, size, width, height, provider)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.key,
        input.url,
        input.name,
        input.alternativeText ?? null,
        input.caption ?? null,
        input.mime,
        input.ext,
        input.size,
        input.width ?? null,
        input.height ?? null,
        input.provider,
      ],
    );
    const created = await this.show(insertId, runner);
    return requireRow(created ? [created] : [], 'INSERT INTO media');
  }

  async update(id: number, changes: MediaUpdate, runner: Queryable = db): Promise<Media | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (changes.name !== undefined) {
      fields.push('name = ?');
      values.push(changes.name);
    }
    if (changes.alternativeText !== undefined) {
      fields.push('alternative_text = ?');
      values.push(changes.alternativeText);
    }
    if (changes.caption !== undefined) {
      fields.push('caption = ?');
      values.push(changes.caption);
    }
    if (!fields.length) return this.show(id, runner);

    values.push(id);
    const { rowCount } = await runner.query(`UPDATE media SET ${fields.join(', ')} WHERE id = ?`, values);
    return rowCount > 0 ? this.show(id, runner) : null;
  }

  async delete(id: number, runner: Queryable = db): Promise<Media | null> {
    const existing = await this.show(id, runner);
    if (!existing) return null;
    await runner.query('DELETE FROM media WHERE id = ?', [id]);
    return existing;
  }

  // Counts the content rows still pointing at a file. Those columns are ON DELETE SET NULL, so a
  // delete would silently blank a slide instead of failing; the service asks first.
  async countReferences(id: number, runner: Queryable = db): Promise<number> {
    const { rows } = await runner.query(
      `SELECT
         (SELECT COUNT(*) FROM header_slides WHERE media_id = ?)
       + (SELECT COUNT(*) FROM recent_projects WHERE media_id = ?)
       + (SELECT COUNT(*) FROM site_documents WHERE media_id = ?) AS count`,
      [id, id, id],
    );
    return Number(rows[0]?.count ?? 0);
  }
}

function where(filters: MediaFilters, params: unknown[]): string {
  const conditions: string[] = [];
  if (filters.search) {
    conditions.push('(LOCATE(?, LOWER(name)) > 0 OR LOCATE(?, LOWER(alternative_text)) > 0)');
    params.push(filters.search.toLowerCase(), filters.search.toLowerCase());
  }
  if (filters.mimeGroup === 'image') conditions.push("mime LIKE 'image/%'");
  if (filters.mimeGroup === 'document') conditions.push("mime NOT LIKE 'image/%'");
  return conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
}

export function toMedia(row: Row): Media {
  return {
    id: Number(row.id),
    key: row.key as string,
    url: row.url as string,
    name: row.name as string,
    alternativeText: (row.alternative_text as string | null) ?? null,
    caption: (row.caption as string | null) ?? null,
    mime: row.mime as string,
    ext: row.ext as string,
    size: Number(row.size),
    width: row.width === null || row.width === undefined ? null : Number(row.width),
    height: row.height === null || row.height === undefined ? null : Number(row.height),
    provider: row.provider as StorageProvider,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}
