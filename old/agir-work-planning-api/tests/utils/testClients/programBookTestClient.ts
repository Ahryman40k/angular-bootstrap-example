import { IProjectIdRequest } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as request from 'superagent';

import { constants, EndpointTypes } from '../../../config/constants';
import { appUtils } from '../../../src/utils/utils';
import { requestService } from '../requestService';

class ProgramBookTestClient {
  private readonly programBookUrl = appUtils.createPublicFullPath(
    constants.locationPaths.PROGRAM_BOOK,
    EndpointTypes.API
  );

  public programProject(programBookId: string, projectIdRequest: IProjectIdRequest): Promise<request.Response> {
    return requestService.post(`${this.programBookUrl}/${programBookId}/projects`, { body: projectIdRequest });
  }
}
export const programBookTestClient = new ProgramBookTestClient();
