import * as request from 'superagent';

import { constants, EndpointTypes } from '../../../config/constants';
import { IPlainPriorityLevelProps } from '../../../src/features/priorityScenarios/models/plainPriorityLevel';
import { appUtils } from '../../../src/utils/utils';
import { requestService } from '../requestService';

class ProgramBookPriorityScenariosTestClient {
  private readonly programBookUrl = appUtils.createPublicFullPath(
    constants.locationPaths.PROGRAM_BOOK,
    EndpointTypes.API
  );

  public updatePriorityLevels(
    programBookId: string,
    priorityScenarioId: string,
    priorityLevels: IPlainPriorityLevelProps[]
  ): Promise<request.Response> {
    return requestService.put(
      `${this.programBookUrl}/${programBookId}/priorityScenarios/${priorityScenarioId}/priorityLevels`,
      { body: priorityLevels }
    );
  }

  public calculatePriorityScenario(programBookId: string, priorityScenarioId: string): Promise<request.Response> {
    return requestService.post(
      `${this.programBookUrl}/${programBookId}/priorityScenarios/${priorityScenarioId}/calculations`,
      {}
    );
  }

  public getOrderedProjects(programBookId: string, priorityScenarioId: string, query?: any): Promise<request.Response> {
    return requestService.get(
      `${this.programBookUrl}/${programBookId}/priorityScenarios/${priorityScenarioId}/orderedProjects`,
      {},
      query
    );
  }

  public putOrderedProjects(
    programBookId: string,
    priorityScenarioId: string,
    projectId: string,
    query?: any
  ): Promise<request.Response> {
    return requestService.put(
      `${this.programBookUrl}/${programBookId}/priorityScenarios/${priorityScenarioId}/orderedProjects/${projectId}/ranks`,
      query
    );
  }
}
export const programBookPriorityScenariosTestClient = new ProgramBookPriorityScenariosTestClient();
