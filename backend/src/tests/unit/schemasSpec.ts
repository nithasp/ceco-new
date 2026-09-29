import { localeQuery, nullableText, paginationSchema, reorderSchema } from '../../schemas/common.schema';
import { newHeaderSlideSchema } from '../../schemas/header.schema';
import { newRecruitmentSchema } from '../../schemas/recruitment.schema';
import { AppError } from '../../utils/errors';
import { isSafeKey, objectKeyFor, slugify } from '../../utils/objectKey';
import { parse } from '../../utils/validation';

describe('Schemas', () => {
  describe('parse', () => {
    it('names the field that failed', () => {
      expect(() => parse(newHeaderSlideSchema, { title: '' })).toThrowMatching(
        (err: AppError) => err.message === 'title is required' && err.statusCode === 400,
      );
    });
  });

  describe('locale', () => {
    it('defaults to Thai', () => {
      expect(parse(localeQuery, {}).locale).toBe('th');
    });

    it('refuses a language the site does not have', () => {
      expect(() => parse(localeQuery, { locale: 'de' })).toThrowError(AppError);
    });
  });

  describe('pagination', () => {
    it('applies defaults', () => {
      expect(parse(paginationSchema, {})).toEqual({ limit: 50, offset: 0 });
    });

    it('reads the numbers out of a query string', () => {
      expect(parse(paginationSchema, { limit: '10', offset: '20' })).toEqual({ limit: 10, offset: 20 });
    });

    // A single request must not be able to pull the whole table
    it('caps the page size', () => {
      expect(() => parse(paginationSchema, { limit: '5000' })).toThrowError(AppError);
    });
  });

  describe('nullableText', () => {
    it('treats a cleared field as no value', () => {
      const schema = nullableText(50);
      expect(schema.parse('')).toBeNull();
      expect(schema.parse(null)).toBeNull();
      expect(schema.parse('  hello  ')).toBe('hello');
    });
  });

  describe('reorder', () => {
    it('accepts a list of ids', () => {
      expect(parse(reorderSchema, { ids: [3, 1, 2] }).ids).toEqual([3, 1, 2]);
    });

    it('refuses a repeated id', () => {
      expect(() => parse(reorderSchema, { ids: [1, 2, 2] })).toThrowError(AppError);
    });

    it('refuses an empty list', () => {
      expect(() => parse(reorderSchema, { ids: [] })).toThrowError(AppError);
    });
  });

  describe('new job', () => {
    it('publishes by default', () => {
      const job = parse(newRecruitmentSchema, { position: 'Engineer', locale: 'th' });
      expect(job.isPublished).toBe(true);
    });

    it('accepts rich text in the description', () => {
      const job = parse(newRecruitmentSchema, {
        position: 'Engineer',
        locale: 'th',
        description: '<p>Requirements</p><ul><li>Degree</li></ul>',
      });
      expect(job.description).toContain('<li>');
    });
  });
});

describe('Object keys', () => {
  it('folds anything that is not a letter or digit into a dash', () => {
    expect(slugify('My Photo (2024).webp')).toBe('my-photo-2024-webp');
    expect(slugify('ภาพถ่าย')).toBe('file');
  });

  it('takes the extension from the allow list, not the filename', () => {
    const key = objectKeyFor('evil.php', '.webp', 'ceco');
    expect(key.endsWith('.webp')).toBe(true);
    expect(key).not.toContain('.php');
  });

  it('gives two uploads of the same name different keys', () => {
    expect(objectKeyFor('photo.webp', '.webp')).not.toBe(objectKeyFor('photo.webp', '.webp'));
  });

  it('keeps a crafted filename inside the prefix', () => {
    const key = objectKeyFor('../../etc/passwd', '.png', 'ceco');
    expect(key.startsWith('ceco/')).toBe(true);
    expect(key).not.toContain('..');
  });

  describe('isSafeKey', () => {
    it('accepts a key the service generated', () => {
      expect(isSafeKey('ceco/2024/01/photo-abc123.webp')).toBe(true);
    });

    it('rejects traversal, absolute paths and backslashes', () => {
      expect(isSafeKey('../secret')).toBe(false);
      expect(isSafeKey('/etc/passwd')).toBe(false);
      expect(isSafeKey('ceco\\win.webp')).toBe(false);
      expect(isSafeKey('')).toBe(false);
    });
  });
});
