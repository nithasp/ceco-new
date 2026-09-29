import { z } from 'zod';
import {
  boolish,
  localeSchema,
  nonNegativeInt,
  nullableText,
  positiveInt,
  requiredText,
} from './common.schema';

// A cleared image picker sends null, which detaches the picture; leaving the field out changes nothing
const imageId = z.union([positiveInt, z.null()]);

export const newHeaderSchema = z.object({
  name: requiredText(100),
  locale: localeSchema,
});

export const headerUpdateSchema = z.object({
  name: requiredText(100),
});

const slideShape = {
  title: requiredText(255),
  description: nullableText(2000),
  imageId,
  position: nonNegativeInt,
  isPublished: boolish,
};

export const newHeaderSlideSchema = z.object({
  title: slideShape.title,
  description: slideShape.description.optional(),
  imageId: slideShape.imageId.optional(),
  position: slideShape.position.optional(),
  isPublished: slideShape.isPublished.default(true),
});

export const headerSlideUpdateSchema = z
  .object({
    title: slideShape.title.optional(),
    description: slideShape.description.optional(),
    imageId: slideShape.imageId.optional(),
    position: slideShape.position.optional(),
    isPublished: slideShape.isPublished.optional(),
  })
  .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
    error: 'must change at least one field',
  });
