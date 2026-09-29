import { z } from 'zod';
import { EXPERIENCE_TYPES } from '../types/experience.types';
import { localeSchema, nonNegativeInt, requiredText, wholeNumber } from './common.schema';

export const experienceTypeSchema = z.enum(EXPERIENCE_TYPES, `must be one of ${EXPERIENCE_TYPES.join(', ')}`);

// Wide enough for a project that has not finished yet, narrow enough to catch a typo
const year = z.union([wholeNumber(1900, 2200), z.null()]);

export const newExperienceSchema = z.object({
  type: experienceTypeSchema,
  locale: localeSchema,
  position: nonNegativeInt.optional(),
});

export const experienceUpdateSchema = z
  .object({
    type: experienceTypeSchema.optional(),
    position: nonNegativeInt.optional(),
  })
  .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
    error: 'must change at least one field',
  });

export const experienceFiltersSchema = z.object({
  locale: localeSchema.optional(),
  type: experienceTypeSchema.optional(),
});

export const experienceTypeParams = z.object({ type: experienceTypeSchema });

export const newCompanySchema = z.object({
  name: requiredText(255),
  position: nonNegativeInt.optional(),
});

export const companyUpdateSchema = z
  .object({
    name: requiredText(255).optional(),
    position: nonNegativeInt.optional(),
  })
  .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
    error: 'must change at least one field',
  });

export const newWorkSchema = z.object({
  description: requiredText(1000),
  year: year.optional(),
  position: nonNegativeInt.optional(),
});

export const workUpdateSchema = z
  .object({
    description: requiredText(1000).optional(),
    year: year.optional(),
    position: nonNegativeInt.optional(),
  })
  .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
    error: 'must change at least one field',
  });
