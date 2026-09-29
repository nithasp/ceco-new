import { z } from 'zod';
import { DOCUMENT_KINDS } from '../types/document.types';
import {
  boolish,
  localeSchema,
  nonNegativeInt,
  nullableLocale,
  nullableText,
  positiveInt,
  requiredText,
} from './common.schema';

export const documentKindSchema = z.enum(DOCUMENT_KINDS, `must be one of ${DOCUMENT_KINDS.join(', ')}`);

const fileId = z.union([positiveInt, z.null()]);

const shape = {
  kind: documentKindSchema,
  name: requiredText(100),
  description: nullableText(1000),
  // null means the file is used in every language
  locale: nullableLocale,
  fileId,
  position: nonNegativeInt,
  isPublished: boolish,
};

export const newDocumentSchema = z.object({
  kind: shape.kind,
  name: shape.name,
  description: shape.description.optional(),
  locale: shape.locale.optional(),
  fileId: shape.fileId.optional(),
  position: shape.position.optional(),
  isPublished: shape.isPublished.default(true),
});

export const documentUpdateSchema = z
  .object({
    name: shape.name.optional(),
    description: shape.description.optional(),
    locale: shape.locale.optional(),
    fileId: shape.fileId.optional(),
    position: shape.position.optional(),
    isPublished: shape.isPublished.optional(),
  })
  .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
    error: 'must change at least one field',
  });

export const documentFiltersSchema = z.object({
  kind: documentKindSchema.optional(),
  locale: localeSchema.optional(),
});

export const documentKindQuery = z.object({
  kind: documentKindSchema.default('pdf'),
  locale: localeSchema.optional(),
});
