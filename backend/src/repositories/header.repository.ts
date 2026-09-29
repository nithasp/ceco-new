import db from '../database';
import { Locale } from '../types/common.types';
import { Queryable, Row } from '../types/database.types';
import {
  HeaderSlide,
  HeaderSlideUpdate,
  HeaderUpdate,
  NewHeader,
  NewHeaderSlide,
  SiteHeader,
} from '../types/header.types';
import { requireRow } from '../utils/rows';

// A slide carries its image inline, so the carousel is one round trip rather than a second call
// per slide
const SLIDE_SELECT = `SELECT s.id, s.title, s.description, s.position, s.is_published, s.media_id,
                             m.url AS media_url, m.alternative_text AS media_alt
                      FROM header_slides s
                      LEFT JOIN media m ON m.id = s.media_id`;

export class HeaderRepository {
  async index(runner: Queryable = db): Promise<SiteHeader[]> {
    const { rows } = await runner.query('SELECT * FROM headers ORDER BY locale ASC, id ASC');
    return Promise.all(rows.map((row) => this.withSlides(toHeader(row), true, runner)));
  }

  async findByLocale(
    locale: Locale,
    includeUnpublished = false,
    runner: Queryable = db,
  ): Promise<SiteHeader | null> {
    const { rows } = await runner.query('SELECT * FROM headers WHERE locale = ? LIMIT 1', [locale]);
    return rows[0] ? this.withSlides(toHeader(rows[0]), includeUnpublished, runner) : null;
  }

  async show(id: number, includeUnpublished = true, runner: Queryable = db): Promise<SiteHeader | null> {
    const { rows } = await runner.query('SELECT * FROM headers WHERE id = ?', [id]);
    return rows[0] ? this.withSlides(toHeader(rows[0]), includeUnpublished, runner) : null;
  }

  async create(input: NewHeader, runner: Queryable = db): Promise<SiteHeader> {
    const { insertId } = await runner.query('INSERT INTO headers (name, locale) VALUES (?, ?)', [
      input.name,
      input.locale,
    ]);
    const created = await this.show(insertId, true, runner);
    return requireRow(created ? [created] : [], 'INSERT INTO headers');
  }

  async update(id: number, changes: HeaderUpdate, runner: Queryable = db): Promise<SiteHeader | null> {
    if (changes.name === undefined) return this.show(id, true, runner);

    const { rowCount } = await runner.query('UPDATE headers SET name = ? WHERE id = ?', [changes.name, id]);
    return rowCount > 0 ? this.show(id, true, runner) : null;
  }

  async delete(id: number, runner: Queryable = db): Promise<boolean> {
    const { rowCount } = await runner.query('DELETE FROM headers WHERE id = ?', [id]);
    return rowCount > 0;
  }

  // ---- slides -------------------------------------------------------------

  async listSlides(
    headerId: number,
    includeUnpublished = true,
    runner: Queryable = db,
  ): Promise<HeaderSlide[]> {
    const published = includeUnpublished ? '' : ' AND s.is_published = 1';
    const { rows } = await runner.query(
      `${SLIDE_SELECT} WHERE s.header_id = ?${published} ORDER BY s.position ASC, s.id ASC`,
      [headerId],
    );
    return rows.map(toSlide);
  }

  async findSlide(id: number, runner: Queryable = db): Promise<HeaderSlide | null> {
    const { rows } = await runner.query(`${SLIDE_SELECT} WHERE s.id = ?`, [id]);
    return rows[0] ? toSlide(rows[0]) : null;
  }

  async slideHeaderId(id: number, runner: Queryable = db): Promise<number | null> {
    const { rows } = await runner.query('SELECT header_id FROM header_slides WHERE id = ?', [id]);
    return rows[0] ? Number(rows[0].header_id) : null;
  }

  async createSlide(headerId: number, input: NewHeaderSlide, runner: Queryable = db): Promise<HeaderSlide> {
    const position = input.position ?? (await this.nextSlidePosition(headerId, runner));
    const { insertId } = await runner.query(
      `INSERT INTO header_slides (header_id, title, description, media_id, position, is_published)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        headerId,
        input.title,
        input.description ?? null,
        input.imageId ?? null,
        position,
        input.isPublished ?? true,
      ],
    );
    const created = await this.findSlide(insertId, runner);
    return requireRow(created ? [created] : [], 'INSERT INTO header_slides');
  }

  async updateSlide(
    id: number,
    changes: HeaderSlideUpdate,
    runner: Queryable = db,
  ): Promise<HeaderSlide | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (changes.title !== undefined) {
      fields.push('title = ?');
      values.push(changes.title);
    }
    if (changes.description !== undefined) {
      fields.push('description = ?');
      values.push(changes.description);
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
    if (!fields.length) return this.findSlide(id, runner);

    values.push(id);
    const { rowCount } = await runner.query(
      `UPDATE header_slides SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );
    return rowCount > 0 ? this.findSlide(id, runner) : null;
  }

  async deleteSlide(id: number, runner: Queryable = db): Promise<boolean> {
    const { rowCount } = await runner.query('DELETE FROM header_slides WHERE id = ?', [id]);
    return rowCount > 0;
  }

  async nextSlidePosition(headerId: number, runner: Queryable = db): Promise<number> {
    const { rows } = await runner.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM header_slides WHERE header_id = ?',
      [headerId],
    );
    return Number(rows[0]?.next ?? 0);
  }

  // Only rows that already belong to the header are moved, so an id from another carousel is
  // ignored rather than reassigned (OWASP API1)
  async setSlideOrder(headerId: number, ids: number[], runner: Queryable = db): Promise<void> {
    for (const [index, id] of ids.entries()) {
      await runner.query('UPDATE header_slides SET position = ? WHERE id = ? AND header_id = ?', [
        index,
        id,
        headerId,
      ]);
    }
  }

  private async withSlides(
    header: SiteHeader,
    includeUnpublished: boolean,
    runner: Queryable,
  ): Promise<SiteHeader> {
    return { ...header, slides: await this.listSlides(header.id, includeUnpublished, runner) };
  }
}

function toHeader(row: Row): SiteHeader {
  return {
    id: Number(row.id),
    name: row.name as string,
    locale: row.locale as Locale,
    slides: [],
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

function toSlide(row: Row): HeaderSlide {
  const mediaId = row.media_id === null || row.media_id === undefined ? null : Number(row.media_id);
  return {
    id: Number(row.id),
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    position: Number(row.position),
    isPublished: Boolean(row.is_published),
    imageId: mediaId,
    imageUrl: (row.media_url as string | null) ?? null,
    imageAlt: (row.media_alt as string | null) ?? null,
  };
}
