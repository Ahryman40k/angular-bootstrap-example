import {
  IDrmProject,
  IEnrichedPaginatedProjects,
  IEnrichedProject,
  IInputDrmProject,
  IPlainProject,
  IProjectSearchRequest,
  ProjectExpand
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { constants, EndpointTypes } from '../../../config/constants';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { appUtils } from '../../../src/utils/utils';
import { normalizeDataTest } from '../normalizeDataTest';
import { requestService } from '../requestService';
import { ITestClientResponse } from './_testClientResponse';

class ProjectTestClient {
  private readonly projectUrl = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);

  public create(project: IPlainProject): Promise<ITestClientResponse<IEnrichedProject>> {
    return requestService.post(this.projectUrl, { body: project });
  }

  public update(id: string, plainProject: IPlainProject): Promise<ITestClientResponse<IEnrichedProject>> {
    return requestService.put(`${this.projectUrl}/${id}`, { body: plainProject });
  }

  public get(projectId: string, expands?: ProjectExpand[]): Promise<ITestClientResponse<IEnrichedProject>> {
    let url = `${this.projectUrl}/${projectId}`;
    if (expands) url += `?${expands.map(e => 'expand=' + e).join('&')}`;
    return requestService.get(url);
  }

  public searchPost(searchRequest?: IProjectSearchRequest): Promise<ITestClientResponse<IEnrichedPaginatedProjects>> {
    return requestService.post(`${this.projectUrl}/search`, { body: searchRequest });
  }

  public async findById(id: string): Promise<IEnrichedProject> {
    const project = await projectRepository.findById(id);
    return normalizeDataTest.normalizeData(project);
  }

  public generateDrmNumberPost(drmProjectInput: IInputDrmProject): Promise<ITestClientResponse<IDrmProject[]>> {
    return requestService.post(`${this.projectUrl}/generateDrmNumber`, { body: drmProjectInput });
  }
}
export const projectTestClient = new ProjectTestClient();
