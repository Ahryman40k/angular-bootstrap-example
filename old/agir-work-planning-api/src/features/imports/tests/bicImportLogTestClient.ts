import { IBicImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as request from 'superagent';

import { constants, EndpointTypes } from '../../../../config/constants';
import { requestService } from '../../../../tests/utils/requestService';
import { ITestClientResponse } from '../../../../tests/utils/testClients/_testClientResponse';
import { IResultPaginated } from '../../../repositories/core/baseRepository';
import { appUtils, isEmpty } from '../../../utils/utils';

class BicImportLogTestClient {
  private readonly bicImportLogsUrl = appUtils.createPublicFullPath(
    constants.locationPaths.BIC_IMPORT_LOGS,
    EndpointTypes.API
  );

  public post(): Promise<request.Response> {
    const url = `${this.bicImportLogsUrl}`;
    return requestService.post(url, {});
  }

  public search(query: string): Promise<ITestClientResponse<IResultPaginated<IBicImportLog>>> {
    let url = `${this.bicImportLogsUrl}`;
    if (!isEmpty(query)) {
      url = `${url}?${query}`;
    }
    return requestService.get(url);
  }
}
export const bicImportLogsTestClient = new BicImportLogTestClient();
