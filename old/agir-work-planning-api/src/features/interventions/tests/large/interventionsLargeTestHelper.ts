import { Response } from 'supertest';
import { constants, EndpointTypes } from '../../../../../config/constants';
import { doRequest } from '../../../../shared/largeTest/largeTestHelper';
import { appUtils } from '../../../../utils/utils';

export enum InterventionRequestType {
  CREATE_INTERVENTION = 'CREATE_INTERVENTION',
  GET_INTERVENTION_BY_ID = 'GET_INTERVENTION_BY_ID',
  UPDATE_INTERVENTION = 'UPDATE_INTERVENTION',
  DELETE_INTERVENTION = 'DELETE_INTERVENTION',
  ADD_COMMENT_TO_INTERVENTION = 'ADD_COMMENT_TO_INTERVENTION',
  UPDATE_INTERVENTION_COMMENT = 'UPDATE_INTERVENTION_COMMENT',
  DELETE_INTERVENTION_COMMENT = 'DELETE_INTERVENTION_COMMENT',
  GET_INTERVENTION_COMMENTS = 'GET_INTERVENTION_COMMENTS',
  ADD_DECISION_TO_INTERVENTION = 'ADD_DECISION_TO_INTERVENTION',
  GET_INTERVENTION_DECISIONS = 'GET_INTERVENTION_DECISIONS',
  UPDATE_INTERVENTION_ANNUAL_DISTRIBUTION = 'UPDATE_INTERVENTION_ANNUAL_DISTRIBUTION'
}

export interface ILargeTestScenarioStep {
  folder: string;
  requestType: InterventionRequestType;
  interventionId?: string;
  expectedHttpStatus?: number;
}

const interventionApiUrl = appUtils.createPublicFullPath(constants.locationPaths.INTERVENTION, EndpointTypes.API);

export async function doInterventionRequest(
  requestType: InterventionRequestType,
  body: any,
  interventionId: string,
  objectId: string
): Promise<Response> {
  switch (requestType) {
    case InterventionRequestType.CREATE_INTERVENTION:
      return await doRequest('post', interventionApiUrl, body);
    case InterventionRequestType.GET_INTERVENTION_BY_ID:
      return await doRequest('get', `${interventionApiUrl}/${interventionId}`, body);
    case InterventionRequestType.UPDATE_INTERVENTION:
      return await doRequest('put', `${interventionApiUrl}/${interventionId}`, body);
    case InterventionRequestType.DELETE_INTERVENTION:
      return await doRequest('delete', `${interventionApiUrl}/${interventionId}`, body);
    case InterventionRequestType.ADD_COMMENT_TO_INTERVENTION:
      return await doRequest('post', `${interventionApiUrl}/${interventionId}/comments`, body);
    case InterventionRequestType.UPDATE_INTERVENTION_COMMENT:
      return await doRequest('put', `${interventionApiUrl}/${interventionId}/comments/${objectId}`, body);
    case InterventionRequestType.DELETE_INTERVENTION_COMMENT:
      return await doRequest('delete', `${interventionApiUrl}/${interventionId}/comments/${objectId}`, body);
    case InterventionRequestType.GET_INTERVENTION_COMMENTS:
      return await doRequest('get', `${interventionApiUrl}/${interventionId}/comments`, body);
    case InterventionRequestType.ADD_DECISION_TO_INTERVENTION:
      return await doRequest('post', `${interventionApiUrl}/${interventionId}/decisions`, body);
    case InterventionRequestType.GET_INTERVENTION_DECISIONS:
      return await doRequest('get', `${interventionApiUrl}/${interventionId}/decisions`, body);
    case InterventionRequestType.UPDATE_INTERVENTION_ANNUAL_DISTRIBUTION:
      return await doRequest('put', `${interventionApiUrl}/${interventionId}/annualDistribution`, body);
    default:
      throw new Error('Unsupported request type :' + requestType);
  }
}

export function getInterventionSuccessHttpStatusResponse(requestType: InterventionRequestType): number {
  switch (requestType) {
    case InterventionRequestType.CREATE_INTERVENTION:
    case InterventionRequestType.ADD_COMMENT_TO_INTERVENTION:
    case InterventionRequestType.ADD_DECISION_TO_INTERVENTION:
      return 201;
    case InterventionRequestType.GET_INTERVENTION_BY_ID:
    case InterventionRequestType.UPDATE_INTERVENTION:
    case InterventionRequestType.UPDATE_INTERVENTION_COMMENT:
    case InterventionRequestType.GET_INTERVENTION_COMMENTS:
    case InterventionRequestType.GET_INTERVENTION_DECISIONS:
    case InterventionRequestType.UPDATE_INTERVENTION_ANNUAL_DISTRIBUTION:
      return 200;
    case InterventionRequestType.DELETE_INTERVENTION:
    case InterventionRequestType.DELETE_INTERVENTION_COMMENT:
      return 204;
    default:
      throw new Error('Unsupported request type :' + requestType);
  }
}
