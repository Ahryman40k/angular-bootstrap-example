import { IRtuProject, IRtuProjectSearchRequest } from '@villemontreal/agir-work-planning-lib/dist/src';

import { constants, EndpointTypes } from '../../../config/constants';
import { appUtils, IPaginatedResult, isEmpty } from '../../../src/utils/utils';
import { requestService } from '../requestService';
import { ITestClientResponse } from './_testClientResponse';

class RtuProjectsTestClient {
  private readonly rtuProjectsUrl = appUtils.createPublicFullPath(
    constants.locationPaths.RTU_PROJECTS,
    EndpointTypes.API
  );

  public search(query: string): Promise<ITestClientResponse<IPaginatedResult<IRtuProject>>> {
    let url = `${this.rtuProjectsUrl}`;
    if (!isEmpty(query)) url = `${url}?${query}`;
    return requestService.get(url);
  }

  public get(id: string, query: string = ''): Promise<ITestClientResponse<IRtuProject>> {
    let url = `${this.rtuProjectsUrl}/${id}`;
    if (!isEmpty(query)) url = `${url}?${query}`;
    return requestService.get(url);
  }

  public searchPost(
    searchRequest?: IRtuProjectSearchRequest
  ): Promise<ITestClientResponse<IPaginatedResult<IRtuProject>>> {
    return requestService.post(`${this.rtuProjectsUrl}/search`, { body: searchRequest });
  }
}
export const rtuProjectsTestClient = new RtuProjectsTestClient();
