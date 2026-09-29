import { z } from 'zod';
import {
  boolish,
  localeSchema,
  nonNegativeInt,
  nullableText,
  requiredText,
  wholeNumber,
} from './common.schema';

const amount = z.union([wholeNumber(0, 9999), z.null()]);

const shape = {
  // The job title. The frontend binds it as `position`, which is the name Strapi used.
  position: requiredText(255),
  // Rich text from the CMS editor. Angular sanitizes it on the way into [innerHTML], which strips
  // scripts and event handlers, so markup from here cannot run in a visitor's browser.
  description: nullableText(20000),
  amount,
  priority: nonNegativeInt,
  locale: localeSchema,
  isPublished: boolish,
};

export const newRecruitmentSchema = z.object({
  position: shape.position,
  description: shape.description.optional(),
  amount: shape.amount.optional(),
  priority: shape.priority.optional(),
  locale: shape.locale,
  isPublished: shape.isPublished.default(true),
});

export const recruitmentUpdateSchema = z
  .object({
    position: shape.position.optional(),
    description: shape.description.optional(),
    amount: shape.amount.optional(),
    priority: shape.priority.optional(),
    locale: shape.locale.optional(),
    isPublished: shape.isPublished.optional(),
  })
  .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
    error: 'must change at least one field',
  });

export const recruitmentFiltersSchema = z.object({
  locale: localeSchema.optional(),
});
