import { z} from 'zod'

export const Intervention = z.object({
    executorId: z.string(),
    interventionNwme: z.string(),
    interventionTypeId: z.string(),
    workTypeId: z.string(),
    requestorId: z.string(),
    boroughId: z.string(),
    interventionYear: z.number().gte(2000),
    planificationYear: z.number().gte(2000),
});
export type Intervention = z.infer<typeof Intervention>