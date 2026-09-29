import { z } from 'zod';
import {
  boolish,
  localeSchema,
  nonNegativeInt,
  nullableText,
  positiveInt,
  requiredText,
} from './common.schema';

const imageId = z.union([positiveInt, z.null()]);

const shape = {
  name: requiredText(255),
  description: nullableText(2000),
  locale: localeSchema,
  imageId,
  position: nonNegativeInt,
  isPublished: boolish,
};

export const newRecentProjectSchema = z.object({
  name: shape.name,
  description: shape.description.optional(),
  locale: shape.locale,
  imageId: shape.imageId.optional(),
  position: shape.position.optional(),
  isPublished: shape.isPublished.default(true),
});

export const recentProjectUpdateSchema = z
  .object({
    name: shape.name.optional(),
    description: shape.description.optional(),
    locale: shape.locale.optional(),
    imageId: shape.imageId.optional(),
    position: shape.position.optional(),
    isPublished: shape.isPublished.optional(),
  })
  .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
    error: 'must change at least one field',
  });

export const recentProjectFiltersSchema = z.object({
  locale: localeSchema.optional(),
});
