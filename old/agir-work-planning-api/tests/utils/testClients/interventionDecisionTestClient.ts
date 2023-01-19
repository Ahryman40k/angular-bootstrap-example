import { IInterventionDecision } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as request from 'superagent';

import { constants, EndpointTypes } from '../../../config/constants';
import { appUtils } from '../../../src/utils/utils';
import { requestService } from '../requestService';

class InterventionDecisionTestClient {
  private readonly interventionUrl = appUtils.createPublicFullPath(
    constants.locationPaths.INTERVENTION,
    EndpointTypes.API
  );

  public create(interventionId: string, decision: IInterventionDecision): Promise<request.Response> {
    return requestService.post(`${this.interventionUrl}/${interventionId}/decisions`, {
      body: decision
    });
  }
}
export const interventionDecisionTestClient = new InterventionDecisionTestClient();
