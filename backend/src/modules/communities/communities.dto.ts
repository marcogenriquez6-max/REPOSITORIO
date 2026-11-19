import { z } from 'zod';

const uuid = z.string().uuid();

export const listCommunitiesSchema = z.object({
  parentId: uuid.optional(),
  active: z.enum(['true', 'false']).optional(),
});

export const createCommunitySchema = z.object({
  name: z.string().min(2).max(200),
  parentId: uuid.nullable().optional(),
  shortDescription: z.string().max(500).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateCommunitySchema = createCommunitySchema.partial();

export type ListCommunitiesDto = z.infer<typeof listCommunitiesSchema>;
export type CreateCommunityDto = z.infer<typeof createCommunitySchema>;
export type UpdateCommunityDto = z.infer<typeof updateCommunitySchema>;
