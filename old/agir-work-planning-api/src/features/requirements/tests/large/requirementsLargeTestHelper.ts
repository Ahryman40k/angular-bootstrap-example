import { Response } from 'supertest';
import { constants, EndpointTypes } from '../../../../../config/constants';
import { doRequest } from '../../../../shared/largeTest/largeTestHelper';
import { appUtils } from '../../../../utils/utils';
import {
  doInterventionRequest,
  getInterventionSuccessHttpStatusResponse,
  InterventionRequestType
} from '../../../interventions/tests/large/interventionsLargeTestHelper';
import {
  doProjectRequest,
  getProjectSuccessHttpStatusResponse,
  ProjectRequestType
} from '../../../projects/tests/large/projectsLargeTestHelper';

export enum RequirementRequestType {
  CREATE_REQUIREMENT = 'CREATE_REQUIREMENT',
  GET_REQUIREMENT = 'GET_REQUIREMENT',
  UPDATE_REQUIREMENT = 'UPDATE_REQUIREMENT',
  DELETE_REQUIREMENT = 'DELETE_REQUIREMENT'
}

export interface ILargeTestScenarioStep {
  folder: string;
  requestType: RequirementRequestType | ProjectRequestType | InterventionRequestType;
  expectedHttpStatus?: number;
}

const requirementApiUrl = appUtils.createPublicFullPath(constants.locationPaths.REQUIREMENTS, EndpointTypes.API);

export async function doRequirementRequest(
  requestType: RequirementRequestType | ProjectRequestType | InterventionRequestType,
  body: any,
  requirementId: string
): Promise<Response> {
  if (Object.values(ProjectRequestType).includes(requestType as ProjectRequestType)) {
    return await doProjectRequest(requestType as ProjectRequestType, body, null, null, null);
  }
  if (Object.values(InterventionRequestType).includes(requestType as InterventionRequestType)) {
    return await doInterventionRequest(requestType as InterventionRequestType, body, null, null);
  }
  switch (requestType) {
    case RequirementRequestType.CREATE_REQUIREMENT:
      return await doRequest('post', requirementApiUrl, body);
    case RequirementRequestType.GET_REQUIREMENT:
      return await doRequest('get', requirementApiUrl, body);
    case RequirementRequestType.UPDATE_REQUIREMENT:
      return await doRequest('put', `${requirementApiUrl}/${requirementId}`, body);
    case RequirementRequestType.DELETE_REQUIREMENT:
      return await doRequest('delete', `${requirementApiUrl}/${requirementId}`, body);
    default:
      throw new Error('Unsupported request type :' + requestType);
  }
}

export function getRequirementSuccessHttpStatusResponse(
  requestType: RequirementRequestType | ProjectRequestType | InterventionRequestType
): number {
  if (Object.values(ProjectRequestType).includes(requestType as ProjectRequestType)) {
    return getProjectSuccessHttpStatusResponse(requestType as ProjectRequestType);
  }
  if (Object.values(InterventionRequestType).includes(requestType as InterventionRequestType)) {
    return getInterventionSuccessHttpStatusResponse(requestType as InterventionRequestType);
  }
  switch (requestType) {
    case RequirementRequestType.CREATE_REQUIREMENT:
      return 201;
    case RequirementRequestType.GET_REQUIREMENT:
    case RequirementRequestType.UPDATE_REQUIREMENT:
      return 200;
    case RequirementRequestType.DELETE_REQUIREMENT:
      return 204;
    default:
      throw new Error('Unsupported request type :' + requestType);
  }
}
