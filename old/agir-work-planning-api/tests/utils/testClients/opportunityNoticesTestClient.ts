import {
  IEnrichedOpportunityNotice,
  IEnrichedOpportunityNoticePaginated,
  IPlainOpportunityNotice
} from '@villemontreal/agir-work-planning-lib/dist/src';
import * as request from 'superagent';

import { constants, EndpointTypes } from '../../../config/constants';
import { appUtils, isEmpty } from '../../../src/utils/utils';
import { requestService } from '../requestService';
import { ITestClientResponse } from './_testClientResponse';

class OpportunityNoticesTestClient {
  private readonly opportunityNoticeUrl = appUtils.createPublicFullPath(
    constants.locationPaths.OPPORTUNITY_NOTICES,
    EndpointTypes.API
  );

  public post(plainOpportunityNotice: IPlainOpportunityNotice): Promise<request.Response> {
    const url = `${this.opportunityNoticeUrl}`;
    return requestService.post(url, { body: plainOpportunityNotice });
  }

  public search(query: string): Promise<ITestClientResponse<IEnrichedOpportunityNoticePaginated>> {
    let url = `${this.opportunityNoticeUrl}`;
    if (!isEmpty(query)) url = `${url}?${query}`;
    return requestService.get(url);
  }

  public get(id: string, query: string = ''): Promise<ITestClientResponse<IEnrichedOpportunityNotice>> {
    let url = `${this.opportunityNoticeUrl}/${id}`;
    if (!isEmpty(query)) url = `${url}?${query}`;
    return requestService.get(url);
  }

  public update(id: string, plainOpportunityNotice: IPlainOpportunityNotice): Promise<request.Response> {
    const url = `${this.opportunityNoticeUrl}/${id}`;
    return requestService.put(url, { body: plainOpportunityNotice });
  }
}
export const opportunityNoticesTestClient = new OpportunityNoticesTestClient();
