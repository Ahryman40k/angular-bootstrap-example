import { IBicProject, IImportProjectRequest, ProjectStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../../config/constants';
import { appUtils } from '../../../src/utils/utils';
import { getBicProject } from '../../data/importData';
import { requestService } from '../requestService';

class ImportTestUtils {
  public mockBicProject(status: string = ProjectStatus.planned): IBicProject {
    const bicProject = getBicProject();
    bicProject.STATUT_PROJET = status;
    return bicProject;
  }

  public async postBicProject(importProjectRequest: IImportProjectRequest): Promise<request.Response> {
    const apiUrl: string = appUtils.createPublicFullPath(
      `${constants.locationPaths.IMPORT_INTERNAL}/projects`,
      EndpointTypes.API
    );

    return requestService.post(apiUrl, { body: importProjectRequest });
  }
}

export const importTestUtils = new ImportTestUtils();
