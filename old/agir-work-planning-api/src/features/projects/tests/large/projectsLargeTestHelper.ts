import { Response } from 'supertest';
import { constants, EndpointTypes } from '../../../../../config/constants';
import { doRequest } from '../../../../shared/largeTest/largeTestHelper';
import { appUtils } from '../../../../utils/utils';
import {
  doInterventionRequest,
  getInterventionSuccessHttpStatusResponse,
  InterventionRequestType
} from '../../../interventions/tests/large/interventionsLargeTestHelper';

export enum ProjectRequestType {
  CREATE_PROJECT = 'CREATE_PROJECT',
  GET_PROJECT_BY_ID = 'GET_PROJECT_BY_ID',
  UPDATE_PROJECT = 'UPDATE_PROJECT',
  ADD_COMMENT_TO_PROJECT = 'ADD_COMMENT_TO_PROJECT',
  UPDATE_PROJECT_COMMENT = 'UPDATE_PROJECT_COMMENT',
  DELETE_PROJECT_COMMENT = 'DELETE_PROJECT_COMMENT',
  GET_PROJECT_COMMENTS = 'GET_PROJECT_COMMENTS',
  ADD_DECISION_TO_PROJECT = 'ADD_DECISION_TO_PROJECT',
  GET_PROJECT_DECISIONS = 'GET_PROJECT_DECISIONS',
  UPDATE_PROJECT_ANNUAL_DISTRIBUTION = 'UPDATE_PROJECT_ANNUAL_DISTRIBUTION'
}

export interface ILargeTestScenarioStep {
  folder: string;
  requestType: ProjectRequestType | InterventionRequestType;
  projectId?: string;
  interventionId?: string;
  expectedHttpStatus?: number;
}

const projectApiUrl = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);

export async function doProjectRequest(
  requestType: ProjectRequestType | InterventionRequestType,
  body: any,
  projectId: string,
  interventionId: string,
  objectId: string
): Promise<Response> {
  if (Object.values(InterventionRequestType).includes(requestType as InterventionRequestType)) {
    return await doInterventionRequest(requestType as InterventionRequestType, body, interventionId, objectId);
  }
  switch (requestType) {
    case ProjectRequestType.CREATE_PROJECT:
      return await doRequest('post', projectApiUrl, body);
    case ProjectRequestType.GET_PROJECT_BY_ID:
      return await doRequest('get', `${projectApiUrl}/${projectId}`, body);
    case ProjectRequestType.UPDATE_PROJECT:
      return await doRequest('put', `${projectApiUrl}/${projectId}`, body);
    case ProjectRequestType.ADD_COMMENT_TO_PROJECT:
      return await doRequest('post', `${projectApiUrl}/${projectId}/comments`, body);
    case ProjectRequestType.UPDATE_PROJECT_COMMENT:
      return await doRequest('put', `${projectApiUrl}/${projectId}/comments/${objectId}`, body);
    case ProjectRequestType.DELETE_PROJECT_COMMENT:
      return await doRequest('delete', `${projectApiUrl}/${projectId}/comments/${objectId}`, body);
    case ProjectRequestType.GET_PROJECT_COMMENTS:
      return await doRequest('get', `${projectApiUrl}/${projectId}/comments`, body);
    case ProjectRequestType.ADD_DECISION_TO_PROJECT:
      return await doRequest('post', `${projectApiUrl}/${projectId}/decisions`, body);
    case ProjectRequestType.GET_PROJECT_DECISIONS:
      return await doRequest('get', `${projectApiUrl}/${projectId}/decisions`, body);
    case ProjectRequestType.UPDATE_PROJECT_ANNUAL_DISTRIBUTION:
      return await doRequest('put', `${projectApiUrl}/${projectId}/annualDistribution`, body);
    default:
      throw new Error('Unsupported request type :' + requestType);
  }
}

export function getProjectSuccessHttpStatusResponse(requestType: ProjectRequestType | InterventionRequestType): number {
  if (Object.values(InterventionRequestType).includes(requestType as InterventionRequestType)) {
    return getInterventionSuccessHttpStatusResponse(requestType as InterventionRequestType);
  }
  switch (requestType) {
    case ProjectRequestType.CREATE_PROJECT:
    case ProjectRequestType.ADD_COMMENT_TO_PROJECT:
    case ProjectRequestType.ADD_DECISION_TO_PROJECT:
      return 201;
    case ProjectRequestType.GET_PROJECT_BY_ID:
    case ProjectRequestType.UPDATE_PROJECT:
    case ProjectRequestType.UPDATE_PROJECT_COMMENT:
    case ProjectRequestType.GET_PROJECT_COMMENTS:
    case ProjectRequestType.GET_PROJECT_DECISIONS:
    case ProjectRequestType.UPDATE_PROJECT_ANNUAL_DISTRIBUTION:
      return 200;
    case ProjectRequestType.DELETE_PROJECT_COMMENT:
      return 204;
    default:
      throw new Error('Unsupported request type :' + requestType);
  }
}
