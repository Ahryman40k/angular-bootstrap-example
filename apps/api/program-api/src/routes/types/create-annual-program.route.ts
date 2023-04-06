import { z } from 'zod';
import { AnnualProgram } from '@ahryman40k/types/program-api-types';




export const CreateAnnualProgramRequest = z.object({
  body: z.object({
    programs: z.array(AnnualProgram),
  }),
});
export type CreateAnnualProgramRequest = z.infer<typeof CreateAnnualProgramRequest>;




export const GetAnnualProgramRequest = z.object({
  params: z.object({
    annualProgramId: z.string(),
  }),
});
export type GetAnnualProgramRequest = z.infer<typeof GetAnnualProgramRequest>;














