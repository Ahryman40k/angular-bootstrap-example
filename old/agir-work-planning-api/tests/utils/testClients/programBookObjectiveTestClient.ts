import { IPlainObjective } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as request from 'superagent';

import { constants, EndpointTypes } from '../../../config/constants';
import { appUtils } from '../../../src/utils/utils';
import { requestService } from '../requestService';

class ProgramBookObjectiveTestClient {
  private readonly programBookUrl = appUtils.createPublicFullPath(
    constants.locationPaths.PROGRAM_BOOK,
    EndpointTypes.API
  );

  public createObjective(programBookId: string, objective: IPlainObjective): Promise<request.Response> {
    return requestService.post(`${this.programBookUrl}/${programBookId}/objectives`, { body: objective });
  }

  public updateObjective(
    programBookId: string,
    objectiveId: string,
    objective: IPlainObjective
  ): Promise<request.Response> {
    return requestService.put(`${this.programBookUrl}/${programBookId}/objectives/${objectiveId}`, { body: objective });
  }
}
export const programBookObjectiveTestClient = new ProgramBookObjectiveTestClient();
