import { z } from 'zod';
import { nullableText, optionalText, searchText } from './common.schema';

export const mediaFiltersSchema = z.object({
  search: searchText,
  mimeGroup: z.enum(['image', 'document'], "must be 'image' or 'document'").optional(),
});

// Sent alongside the file as multipart fields, so every value arrives as text
export const uploadMetaSchema = z.object({
  name: optionalText(255),
  alternativeText: nullableText(255).optional(),
  caption: nullableText(500).optional(),
});

export const mediaUpdateSchema = z
  .object({
    name: optionalText(255),
    alternativeText: nullableText(255).optional(),
    caption: nullableText(500).optional(),
  })
  .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
    error: 'must change at least one field',
  });

export const mediaDeleteQuery = z.object({
  force: z
    .preprocess((value) => value === 'true' || value === '1' || value === true, z.boolean())
    .default(false),
});
