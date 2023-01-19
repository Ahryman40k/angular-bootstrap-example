import { IProjectDecision } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as request from 'superagent';

import { constants, EndpointTypes } from '../../../config/constants';
import { appUtils } from '../../../src/utils/utils';
import { requestService } from '../requestService';

class ProjectDecisionTestClient {
  private readonly projectUrl = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);

  public create(projectId: string, decision: IProjectDecision, annualPeriod?: number): Promise<request.Response> {
    return requestService.post(`${this.projectUrl}/${projectId}/decisions`, {
      body: { decision, annualPeriodYear: annualPeriod }
    });
  }
}
export const projectDecisionTestClient = new ProjectDecisionTestClient();
