import { IDrmProject } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../../shared/mappers/fromModelToDtoMappings';
import { DrmProject } from '../../models/drm/drmProject';

class DrmProjectMapperDTO extends FromModelToDtoMappings<DrmProject, IDrmProject, void> {
  protected async getFromNotNullModel(drmProject: DrmProject): Promise<IDrmProject> {
    return this.map(drmProject);
  }

  private map(drmProject: DrmProject): IDrmProject {
    return {
      projectId: drmProject.projectId,
      drmNumber: drmProject.drmNumber
    };
  }
}

export const drmProjectMapperDTO = new DrmProjectMapperDTO();
