import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';

import { constants, EndpointTypes } from '../../../config/constants';
import { appUtils, IPaginatedResult, isEmpty } from '../../../src/utils/utils';
import { requestService } from '../requestService';
import { ITestClientResponse } from './_testClientResponse';

class ProgramBooksTestClient {
  private readonly programBooksUrl = appUtils.createPublicFullPath(
    constants.locationPaths.PROGRAM_BOOK,
    EndpointTypes.API
  );

  public search(query: string): Promise<ITestClientResponse<IPaginatedResult<IEnrichedProgramBook>>> {
    let url = `${this.programBooksUrl}`;
    if (!isEmpty(query)) url = `${url}?${query}`;
    return requestService.get(url);
  }
}
export const programBooksTestClient = new ProgramBooksTestClient();
