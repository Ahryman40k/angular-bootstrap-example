import { IEnrichedProject, IPlainProject, ProjectType } from '@villemontreal/agir-work-planning-lib/dist/src';

import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { errorMtlMapper } from '../../../src/shared/domainErrors/errorMapperMtlApi';
import { UnexpectedError } from '../../../src/shared/domainErrors/unexpectedError';
import { Result } from '../../../src/shared/logic/result';
import { createEnrichedProject, enrichedToPlain } from '../projectData';
import { IDataGenerator } from './_dataGenerator';

class ProjectDataGenerator implements IDataGenerator<IEnrichedProject, IPlainProject> {
  public createEnriched(partial: Partial<IEnrichedProject>): IEnrichedProject {
    return createEnrichedProject(partial);
  }

  public createPlain(partial: Partial<IPlainProject>): IPlainProject {
    return enrichedToPlain(this.createEnriched(partial));
  }

  public createPlainNonGeo(partial: Partial<IPlainProject>): IPlainProject {
    const plain = enrichedToPlain(this.createEnriched(partial));
    plain.projectTypeId = ProjectType.other;
    delete plain.geometry;
    delete plain.interventionIds;
    return plain;
  }

  public async store(
    partial: Partial<IEnrichedProject>,
    preStore?: (project: IEnrichedProject) => void
  ): Promise<IEnrichedProject> {
    const enriched = this.createEnriched(partial);
    if (preStore) preStore(enriched);
    const saveResult = await projectRepository.save(enriched);
    if (saveResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(saveResult)));
    }
    return saveResult.getValue();
  }

  public async update(
    project: IEnrichedProject,
    partial?: Partial<IEnrichedProject>,
    preStore?: (project: IEnrichedProject) => void
  ): Promise<IEnrichedProject> {
    const enriched = Object.assign({}, project, partial);
    if (preStore) preStore(enriched);
    const saveResult = await projectRepository.save(enriched);
    if (saveResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(saveResult)));
    }
    return saveResult.getValue();
  }

  public createPlainFromEnriched(enriched: IEnrichedProject): IPlainProject {
    return enrichedToPlain(enriched);
  }
}

export const projectDataGenerator = new ProjectDataGenerator();
