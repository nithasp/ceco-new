import db from '../database';
import { Locale } from '../types/common.types';
import { Queryable, Row } from '../types/database.types';
import {
  DocumentKind,
  NewSiteDocument,
  SiteDocument,
  SiteDocumentFilters,
  SiteDocumentUpdate,
} from '../types/document.types';
import { requireRow } from '../utils/rows';

const SELECT = `SELECT d.*, m.url AS media_url, m.name AS media_name, m.mime AS media_mime
                FROM site_documents d
                LEFT JOIN media m ON m.id = d.media_id`;

export class SiteDocumentRepository {
  async index(filters: SiteDocumentFilters, runner: Queryable = db): Promise<SiteDocument[]> {
    const params: unknown[] = [];
    const { rows } = await runner.query(
      `${SELECT}${where(filters, params)} ORDER BY d.position ASC, d.id ASC`,
      params,
    );
    return rows.map(toSiteDocument);
  }

  async show(id: number, runner: Queryable = db): Promise<SiteDocument | null> {
    const { rows } = await runner.query(`${SELECT} WHERE d.id = ?`, [id]);
    return rows[0] ? toSiteDocument(rows[0]) : null;
  }

  async findByName(kind: DocumentKind, name: string, runner: Queryable = db): Promise<SiteDocument | null> {
    const { rows } = await runner.query(
      `${SELECT} WHERE d.kind = ? AND LOWER(d.name) = LOWER(?) AND d.is_published = 1
       ORDER BY d.position ASC, d.id ASC LIMIT 1`,
      [kind, name],
    );
    return rows[0] ? toSiteDocument(rows[0]) : null;
  }

  // The navbar shows one logo: the first published row of that kind, whatever its locale
  async findFirst(kind: DocumentKind, locale?: Locale, runner: Queryable = db): Promise<SiteDocument | null> {
    const params: unknown[] = [kind];
    const localeClause = locale ? ' AND (d.locale = ? OR d.locale IS NULL)' : '';
    if (locale) params.push(locale);

    const { rows } = await runner.query(
      `${SELECT} WHERE d.kind = ? AND d.is_published = 1${localeClause}
       ORDER BY d.position ASC, d.id ASC LIMIT 1`,
      params,
    );
    return rows[0] ? toSiteDocument(rows[0]) : null;
  }

  async create(input: NewSiteDocument, runner: Queryable = db): Promise<SiteDocument> {
    const position = input.position ?? (await this.nextPosition(input.kind, runner));
    const { insertId } = await runner.query(
      `INSERT INTO site_documents (kind, name, description, locale, media_id, position, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.kind,
        input.name,
        input.description ?? null,
        input.locale ?? null,
        input.fileId ?? null,
        position,
        input.isPublished ?? true,
      ],
    );
    const created = await this.show(insertId, runner);
    return requireRow(created ? [created] : [], 'INSERT INTO site_documents');
  }

  async update(
    id: number,
    changes: SiteDocumentUpdate,
    runner: Queryable = db,
  ): Promise<SiteDocument | null> {
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
    if (changes.fileId !== undefined) {
      fields.push('media_id = ?');
      values.push(changes.fileId);
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
      `UPDATE site_documents SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
    return rowCount > 0 ? this.show(id, runner) : null;
  }

  async delete(id: number, runner: Queryable = db): Promise<boolean> {
    const { rowCount } = await runner.query('DELETE FROM site_documents WHERE id = ?', [id]);
    return rowCount > 0;
  }

  async nextPosition(kind: DocumentKind, runner: Queryable = db): Promise<number> {
    const { rows } = await runner.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM site_documents WHERE kind = ?',
      [kind],
    );
    return Number(rows[0]?.next ?? 0);
  }
}

function where(filters: SiteDocumentFilters, params: unknown[]): string {
  const conditions: string[] = [];
  if (filters.kind) {
    conditions.push('d.kind = ?');
    params.push(filters.kind);
  }
  if (filters.locale) {
    // A row with no locale belongs to every language
    conditions.push('(d.locale = ? OR d.locale IS NULL)');
    params.push(filters.locale);
  }
  if (!filters.includeUnpublished) conditions.push('d.is_published = 1');
  return conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
}

function toSiteDocument(row: Row): SiteDocument {
  const mediaId = row.media_id === null || row.media_id === undefined ? null : Number(row.media_id);
  return {
    id: Number(row.id),
    kind: row.kind as DocumentKind,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    locale: (row.locale as Locale | null) ?? null,
    position: Number(row.position),
    isPublished: Boolean(row.is_published),
    fileId: mediaId,
    fileUrl: (row.media_url as string | null) ?? null,
    fileName: (row.media_name as string | null) ?? null,
    fileMime: (row.media_mime as string | null) ?? null,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}
