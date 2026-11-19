import { z } from 'zod';

export const uploadBitstreamSchema = z.object({
  bundle: z.enum(['ORIGINAL', 'THUMBNAIL', 'LICENCIA']).default('ORIGINAL'),
  description: z.string().max(500).optional(),
});

export type UploadBitstreamDto = z.infer<typeof uploadBitstreamSchema>;
