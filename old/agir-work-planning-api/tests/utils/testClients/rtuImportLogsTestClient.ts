import { IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import { constants, EndpointTypes } from '../../../config/constants';
import { appUtils, IPaginatedResult, isEmpty } from '../../../src/utils/utils';
import { requestService } from '../requestService';
import { ITestClientResponse } from './_testClientResponse';

class RtuImportLogsTestClient {
  private readonly rtuImportLogsUrl = appUtils.createPublicFullPath(
    constants.locationPaths.RTU_IMPORT_LOGS,
    EndpointTypes.API
  );

  public search(query: string): Promise<ITestClientResponse<IPaginatedResult<IRtuImportLog>>> {
    let url = `${this.rtuImportLogsUrl}`;
    if (!isEmpty(query)) url = `${url}?${query}`;
    return requestService.get(url);
  }

  public get(id: string, query: string = ''): Promise<ITestClientResponse<IRtuImportLog>> {
    let url = `${this.rtuImportLogsUrl}/${id}`;
    if (!isEmpty(query)) url = `${url}?${query}`;
    return requestService.get(url);
  }
}
export const rtuImportLogsTestClient = new RtuImportLogsTestClient();
