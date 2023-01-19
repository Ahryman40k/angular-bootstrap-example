import { IRtuExportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import { constants, EndpointTypes } from '../../../config/constants';
import { appUtils, IPaginatedResult, isEmpty } from '../../../src/utils/utils';
import { requestService } from '../requestService';
import { ITestClientResponse } from './_testClientResponse';

class RtuExportLogsTestClient {
  private readonly rtuExportLogsUrl = appUtils.createPublicFullPath(
    constants.locationPaths.RTU_EXPORT_LOGS,
    EndpointTypes.API
  );

  public search(query: string): Promise<ITestClientResponse<IPaginatedResult<IRtuExportLog>>> {
    let url = `${this.rtuExportLogsUrl}`;
    if (!isEmpty(query)) url = `${url}?${query}`;
    return requestService.get(url);
  }

  public get(id: string, query: string = ''): Promise<ITestClientResponse<IRtuExportLog>> {
    let url = `${this.rtuExportLogsUrl}/${id}`;
    if (!isEmpty(query)) url = `${url}?${query}`;
    return requestService.get(url);
  }
}
export const rtuExportLogsTestClient = new RtuExportLogsTestClient();
