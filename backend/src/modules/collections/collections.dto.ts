import { z } from 'zod';

const uuid = z.string().uuid();

export const listCollectionsSchema = z.object({
  communityId: uuid.optional(),
  active: z.enum(['true', 'false']).optional(),
});

export const createCollectionSchema = z.object({
  name: z.string().min(2).max(200),
  communityId: uuid,
  shortDescription: z.string().max(500).optional(),
  licenseText: z.string().max(20000).optional(),
  workflowEnabled: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateCollectionSchema = createCollectionSchema.partial().omit({ communityId: true });

export type ListCollectionsDto = z.infer<typeof listCollectionsSchema>;
export type CreateCollectionDto = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionDto = z.infer<typeof updateCollectionSchema>;
