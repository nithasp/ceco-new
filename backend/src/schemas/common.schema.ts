import { z } from 'zod';
import { DEFAULT_LOCALE, LOCALES } from '../types/common.types';

export const PAGINATION_DEFAULT_LIMIT = 50;
export const PAGINATION_MAX_LIMIT = 100;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_QUERY_STRING_LENGTH = 100;

const WHOLE_NUMBER = 'must be a whole number greater than 0';

export const asNumber = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

// A query string carries everything as text, so 'true' and '1' have to count as true
export const asBoolean = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const text = value.trim().toLowerCase();
  if (text === 'true' || text === '1') return true;
  if (text === 'false' || text === '0') return false;
  return value;
};

export const wholeNumber = (min: number, max: number) => {
  const message = `must be a whole number between ${min} and ${max}`;
  return z.preprocess(asNumber, z.number(message).int(message).min(min, message).max(max, message));
};

export const positiveInt = z.preprocess(
  asNumber,
  z.number(WHOLE_NUMBER).int(WHOLE_NUMBER).positive(WHOLE_NUMBER),
);

export const nonNegativeInt = z.preprocess(
  asNumber,
  z
    .number('must be a whole number of 0 or more')
    .int('must be a whole number of 0 or more')
    .nonnegative('must be a whole number of 0 or more'),
);

export const boolish = z.preprocess(asBoolean, z.boolean('must be true or false'));

export const requiredText = (max: number) =>
  z.string('is required').trim().min(1, 'is required').max(max, `must be at most ${max} characters`);

export const optionalText = (max: number) => requiredText(max).optional();

// An empty string from a cleared form field means "no value", not a value of ''
export const nullableText = (max: number) =>
  z
    .union([z.string().trim().max(max, `must be at most ${max} characters`), z.null()])
    .transform((value) => (value === null || value === '' ? null : value));

export const password = z
  .string('is required')
  .min(MIN_PASSWORD_LENGTH, `must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(128, 'must be at most 128 characters');

export const idParams = z.object({ id: positiveInt });

export const localeSchema = z.enum(LOCALES, `must be one of ${LOCALES.join(', ')}`);

// Every public content route takes ?locale=, and the site's own default stands in when it is absent
export const localeQuery = z.object({ locale: localeSchema.default(DEFAULT_LOCALE) });

export const nullableLocale = z
  .union([localeSchema, z.null()])
  .transform((value) => (value === null ? null : value));

// Bounded page size so a single list request can't pull the whole table (OWASP API4)
export const paginationSchema = z.object({
  limit: wholeNumber(1, PAGINATION_MAX_LIMIT).default(PAGINATION_DEFAULT_LIMIT),
  offset: nonNegativeInt.default(0),
});

export const searchText = z
  .string('must be a single value')
  .max(MAX_QUERY_STRING_LENGTH, `must be at most ${MAX_QUERY_STRING_LENGTH} characters`)
  .transform((value) => value.trim())
  .transform((value) => (value === '' ? undefined : value))
  .optional();

// A reorder sends the ids in their new order. Bounded, and each id may appear once, so a payload
// cannot make the server issue an unbounded number of statements (OWASP API4)
export const reorderSchema = z.object({
  ids: z
    .array(positiveInt, 'must be a list of ids')
    .min(1, 'must contain at least one id')
    .max(200, 'must contain at most 200 ids')
    .refine((ids) => new Set(ids).size === ids.length, { error: 'must not repeat an id' }),
});
