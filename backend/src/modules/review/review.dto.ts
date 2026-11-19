import { z } from 'zod';
import { ItemStatus, ObservationType } from '@prisma/client';

const booleanQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

export const inboxSchema = z.object({
  q: z.string().trim().max(200).optional(),
  author: z.string().trim().max(200).optional(),
  status: z.nativeEnum(ItemStatus).optional(),
  communityId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  year: z.string().regex(/^\d{4}$/).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  assignedToMe: booleanQuery.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const checksSchema = z.object({
  checks: z.array(z.object({
    key: z.string().min(1).max(64),
    passed: z.boolean(),
    notes: z.string().max(2000).optional(),
  })).min(1),
});

export const observationSchema = z.object({
  type: z.nativeEnum(ObservationType).default(ObservationType.OBSERVACION),
  description: z.string().trim().min(5, 'La descripción es obligatoria').max(5000),
});

export const resolveObservationSchema = z.object({
  response: z.string().trim().min(1, 'La respuesta es obligatoria').max(5000),
});

export const decisionSchema = z.object({
  comment: z.string().trim().min(1, 'La justificación es obligatoria').max(2000),
  embargoDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).superRefine((value, ctx) => {
  if (!value.embargoDate) return;
  const date = new Date(`${value.embargoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Fecha de embargo inválida', path: ['embargoDate'] });
  } else if (date.getTime() <= Date.now()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La fecha de embargo debe ser futura', path: ['embargoDate'] });
  }
});

export type InboxDto = z.infer<typeof inboxSchema>;
export type ChecksDto = z.infer<typeof checksSchema>;
export type ObservationDto = z.infer<typeof observationSchema>;
export type DecisionDto = z.infer<typeof decisionSchema>;
