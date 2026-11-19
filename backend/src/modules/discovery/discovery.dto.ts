import { z } from 'zod';
import { ItemStatus } from '@prisma/client';

export const searchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.nativeEnum(ItemStatus).optional(),
  communityId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchDto = z.infer<typeof searchSchema>;
