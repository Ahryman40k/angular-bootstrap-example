import { IAssetsWorkAreaSearchRequest } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as request from 'superagent';

import { constants, EndpointTypes } from '../../../config/constants';
import { appUtils } from '../../../src/utils/utils';
import { requestService } from '../requestService';

class AssetsWorkAreaTestClient {
  private readonly searchAssetsWorkAreaUrl = appUtils.createPublicFullPath(
    constants.locationPaths.ASSETS_SEARCH_WORK_AREA,
    EndpointTypes.API
  );

  public post(assetsWorkAreaSearchRequest: IAssetsWorkAreaSearchRequest): Promise<request.Response> {
    const url = `${this.searchAssetsWorkAreaUrl}`;
    return requestService.post(url, { body: assetsWorkAreaSearchRequest });
  }
}
export const assetsWorkAreaTestClient = new AssetsWorkAreaTestClient();
