import * as z from 'zod';

export const MAX_TRADES = 10;
export const FEATURED_COUNT = 3;

export const agencyTradesSchema = z.object({
  trade_ids: z
    .array(z.string().uuid('Each trade ID must be a valid UUID'))
    .min(1, 'At least one trade must be selected')
    .max(MAX_TRADES, `Maximum ${MAX_TRADES} trades allowed`),
});

export type AgencyTradesUpdateData = z.infer<typeof agencyTradesSchema>;
