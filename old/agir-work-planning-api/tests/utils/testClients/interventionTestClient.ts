import {
  IEnrichedIntervention,
  IInterventionDecision,
  InterventionExpand,
  IPlainIntervention
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { constants, EndpointTypes } from '../../../config/constants';
import { InterventionFindOptions } from '../../../src/features/interventions/models/interventionFindOptions';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { appUtils } from '../../../src/utils/utils';
import { requestService } from '../requestService';
import { ITestClientResponse } from './_testClientResponse';

class InterventionTestClient {
  private readonly interventionUrl = appUtils.createPublicFullPath(
    constants.locationPaths.INTERVENTION,
    EndpointTypes.API
  );

  public get(
    interventionId: string,
    expands?: InterventionExpand[]
  ): Promise<ITestClientResponse<IEnrichedIntervention>> {
    let url = `${this.interventionUrl}/${interventionId}`;
    if (expands) url += `?${expands.map(e => 'expand=' + e).join('&')}`;
    return requestService.get(url);
  }

  public update(
    interventionId: string,
    plainIntervention: IPlainIntervention
  ): Promise<ITestClientResponse<IEnrichedIntervention>> {
    return requestService.put(`${this.interventionUrl}/${interventionId}`, { body: plainIntervention });
  }

  public delete(interventionId: string): Promise<ITestClientResponse<IEnrichedIntervention>> {
    const url = `${this.interventionUrl}/${interventionId}`;
    return requestService.delete(url);
  }

  public createDecision(
    interventionId: string,
    interventionDecision: IInterventionDecision
  ): Promise<ITestClientResponse<IEnrichedIntervention>> {
    return requestService.post(`${this.interventionUrl}/${interventionId}/decisions`, { body: interventionDecision });
  }

  public async findByIds(interventionIds: string[]): Promise<IEnrichedIntervention[]> {
    return interventionRepository.findAll(
      InterventionFindOptions.create({
        criterias: {
          id: interventionIds
        }
      }).getValue()
    );
  }
}

export const interventionTestClient = new InterventionTestClient();
