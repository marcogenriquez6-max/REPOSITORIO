import { z } from 'zod';
import { ItemStatus } from '@prisma/client';

const uuid = z.string().uuid();
const booleanQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

const metadataInput = z.object({
  schema: z.string().min(1).max(32).default('dc'),
  element: z.string().min(1).max(64),
  qualifier: z.string().max(64).nullable().optional(),
  value: z.string().min(1).max(20000),
  lang: z.string().max(16).optional(),
});

export const listItemsSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.nativeEnum(ItemStatus).optional(),
  communityId: uuid.optional(),
  collectionId: uuid.optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  mine: booleanQuery.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createItemSchema = z.object({
  collectionId: uuid,
  metadata: z.array(metadataInput).min(1),
});

export const updateMetadataSchema = z.object({
  metadata: z.array(metadataInput).min(1),
});

export const assignReviewerSchema = z.object({
  reviewerId: uuid,
});

export type ListItemsDto = z.infer<typeof listItemsSchema>;
export type CreateItemDto = z.infer<typeof createItemSchema>;
export type UpdateMetadataDto = z.infer<typeof updateMetadataSchema>;
