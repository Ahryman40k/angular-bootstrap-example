import { z } from 'zod';

export const CreateSubmissionRequest = z.object({
  body: z.object({
    submissions: z.array(
      z.object({
        programBookId: z.string(),
        projectIds: z.array(z.string()),
      })
    ),
  }),
});
export type CreateSubmissionRequest = z.infer<typeof CreateSubmissionRequest>;

export const GetSubmissionByIdRequest = z.object({
  params: z.object({
    submissionId: z.string(),
  }),
});
export type GetSubmissionByIdRequest = z.infer<typeof GetSubmissionByIdRequest>;
