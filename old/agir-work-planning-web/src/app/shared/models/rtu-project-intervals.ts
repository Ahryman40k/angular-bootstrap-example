import { IRtuProject } from '@villemontreal/agir-work-planning-lib/dist/src';

export interface IRtuProjectIntervals {
  pastProjects: IRtuProject[];
  presentProjects: IRtuProject[];
  futureProjects: IRtuProject[];
}
