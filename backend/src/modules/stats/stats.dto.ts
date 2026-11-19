import { z } from 'zod';

export const placeholderSchema = z.object({});
export type PlaceholderDto = z.infer<typeof placeholderSchema>;
