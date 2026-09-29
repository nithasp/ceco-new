import { z } from 'zod';
import { password, requiredText } from './common.schema';

export const loginSchema = z.object({
  username: requiredText(100),
  password: z.string('is required').min(1, 'is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string('is required').min(1, 'is required'),
  newPassword: password,
});

export const profileUpdateSchema = z
  .object({
    firstName: requiredText(100).optional(),
    lastName: requiredText(100).optional(),
    username: requiredText(100).optional(),
  })
  .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
    error: 'must change at least one field',
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
