import { z } from 'zod';

export const ProjectStatus = z.union([z.literal('planned'), z.literal('cancelled')]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const MinimalProject = z.object({
  projectName: z.string(),
  projectTypeId: z.union([z.literal('integrated'), z.literal('non-integrated')]),
  startYear: z.number().gte(2000),
  endYear: z.number().gte(2000),
  status: ProjectStatus,
});

export type MinimalProject = z.infer<typeof MinimalProject>;

export const Project = MinimalProject.extend({});

export type Project = z.infer<typeof Project>;
