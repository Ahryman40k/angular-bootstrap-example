import { Response } from 'supertest';
import { constants, EndpointTypes } from '../../../../../config/constants';
import { doRequest } from '../../../../shared/largeTest/largeTestHelper';
import { appUtils } from '../../../../utils/utils';

export enum AnnualProgramRequestType {
  CREATE_ANNUAL_PROGRAM = 'CREATE_ANNUAL_PROGRAM',
  GET_ANNUAL_PROGRAM_BY_ID = 'GET_ANNUAL_PROGRAM_BY_ID',
  UPDATE_ANNUAL_PROGRAM = 'UPDATE_ANNUAL_PROGRAM',
  DELETE_ANNUAL_PROGRAM = 'DELETE_ANNUAL_PROGRAM'
}

export interface ILargeTestScenarioStep {
  folder: string;
  requestType: AnnualProgramRequestType;
  expectedHttpStatus?: number;
}

const annualProgramApiUrl = appUtils.createPublicFullPath(constants.locationPaths.ANNUAL_PROGRAM, EndpointTypes.API);

export async function doAnnualProgramRequest(
  requestType: AnnualProgramRequestType,
  body: any,
  annualProgramId: string
): Promise<Response> {
  switch (requestType) {
    case AnnualProgramRequestType.CREATE_ANNUAL_PROGRAM:
      return await doRequest('post', annualProgramApiUrl, body);
    case AnnualProgramRequestType.GET_ANNUAL_PROGRAM_BY_ID:
      return await doRequest('get', `${annualProgramApiUrl}/${annualProgramId}`, body);
    case AnnualProgramRequestType.UPDATE_ANNUAL_PROGRAM:
      return await doRequest('put', `${annualProgramApiUrl}/${annualProgramId}`, body);
    case AnnualProgramRequestType.DELETE_ANNUAL_PROGRAM:
      return await doRequest('delete', `${annualProgramApiUrl}/${annualProgramId}`, body);
    default:
      throw new Error('Unsupported request type :' + requestType);
  }
}

export function getSuccessHttpStatusResponse(requestType: AnnualProgramRequestType): number {
  switch (requestType) {
    case AnnualProgramRequestType.CREATE_ANNUAL_PROGRAM:
      return 201;
    case AnnualProgramRequestType.GET_ANNUAL_PROGRAM_BY_ID:
    case AnnualProgramRequestType.UPDATE_ANNUAL_PROGRAM:
      return 200;
    case AnnualProgramRequestType.DELETE_ANNUAL_PROGRAM:
      return 204;
    default:
      throw new Error('Unsupported request type :' + requestType);
  }
}
