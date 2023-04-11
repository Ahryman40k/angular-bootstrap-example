import { z } from 'zod'

export const MongoConfig = z.object({
  url: z.string(),
  database_name: z.string()
})
export type  MongoConfig = z.infer<typeof MongoConfig>;
