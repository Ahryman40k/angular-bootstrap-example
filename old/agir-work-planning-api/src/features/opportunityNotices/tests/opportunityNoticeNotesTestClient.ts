import { IPlainNote } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as request from 'superagent';

import { constants, EndpointTypes } from '../../../../config/constants';
import { requestService } from '../../../../tests/utils/requestService';
import { appUtils } from '../../../utils/utils';

const opportunityNoticeUrl = appUtils.createPublicFullPath(
  constants.locationPaths.OPPORTUNITY_NOTICES,
  EndpointTypes.API
);

class OpportunityNoticeNotesTestClient {
  public post(opportunityNoticeId: string, plainOpportunityNoticeNote: IPlainNote): Promise<request.Response> {
    const url = `${opportunityNoticeUrl}/${opportunityNoticeId}/notes`;
    return requestService.post(url, { body: plainOpportunityNoticeNote });
  }

  public put(
    opportunityNoticeId: string,
    opportunityNoticeNoteId: string,
    plainOpportunityNoticeNote: IPlainNote
  ): Promise<request.Response> {
    const url = `${opportunityNoticeUrl}/${opportunityNoticeId}/notes/${opportunityNoticeNoteId}`;
    return requestService.put(url, { body: plainOpportunityNoticeNote });
  }
}
export const opportunityNoticeNotesTestClient = new OpportunityNoticeNotesTestClient();
