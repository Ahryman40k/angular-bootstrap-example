import { z } from 'zod';
import { AnnualProgram } from '@ahryman40k/types/program-api-types';




export const CreateAnnualProgramRequest = z.object({
  body: z.object({
    programs: z.array(AnnualProgram),
  }),
});
export type CreateAnnualProgramRequest = z.infer<typeof CreateAnnualProgramRequest>;





export const GetAnnualProgramByIdRequest = z.object({
  params: z.object({
    annualProgramId: z.string(),
  }),
});
export type GetAnnualProgramByIdRequest = z.infer<typeof GetAnnualProgramByIdRequest>;




export const GetAnnualProgramByExecutorIdRequest = z.object({
  params: z.object({
    executorId: z.string(),
  }),
});
export type GetAnnualProgramByExecutorIdRequest = z.infer<typeof GetAnnualProgramByExecutorIdRequest>;












