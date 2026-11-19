import { z } from 'zod';
import { UserRole } from '@prisma/client';

const uuid = z.string().uuid();

export const listUsersSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(200),
  role: z.nativeEnum(UserRole),
  password: z.string().min(8).max(128),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(200).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export const assignFacultiesSchema = z.object({
  communityIds: z.array(uuid).min(1),
});

export type ListUsersDto = z.infer<typeof listUsersSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
