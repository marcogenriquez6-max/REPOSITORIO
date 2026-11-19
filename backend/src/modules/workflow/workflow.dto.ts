import { z } from 'zod';

export const approveSchema = z.object({
  comment: z.string().max(2000).optional(),
  embargoDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD; if set -> EMBARGADO
});

export const observeSchema = z.object({
  comment: z.string().trim().min(1, 'El comentario es obligatorio').max(2000),
});

export type ApproveDto = z.infer<typeof approveSchema>;
export type ObserveDto = z.infer<typeof observeSchema>;
