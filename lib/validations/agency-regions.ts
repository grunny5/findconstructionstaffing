import * as z from 'zod';

export const agencyRegionsSchema = z.object({
  region_ids: z
    .array(z.string().uuid('Each region ID must be a valid UUID'))
    .min(1, 'At least one region must be selected'),
});

export type AgencyRegionsUpdateData = z.infer<typeof agencyRegionsSchema>;
