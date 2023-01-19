import { IInterventionSearchRequest } from '@villemontreal/agir-work-planning-lib';

import { parseBooleanKeys } from '../utils/booleanUtils';
import { parseIntKeys } from '../utils/numberUtils';
import { BaseSanitizer } from './baseSanitizer';

export class InterventionSearchRequestSanitizer extends BaseSanitizer<IInterventionSearchRequest> {
  /**
   * Sanitizes the intervention search request.
   * Converts string params to number.
   * @param item The intervention search request.
   */
  public sanitize(item: IInterventionSearchRequest): IInterventionSearchRequest {
    if (!item) {
      return item;
    }
    parseIntKeys(item, [
      'interventionYear',
      'fromInterventionYear',
      'toInterventionYear',
      'planificationYear',
      'fromPlanificationYear',
      'toPlanificationYear',
      'estimate',
      'fromEstimate',
      'toEstimate'
    ]);
    parseBooleanKeys(item, ['decisionRequired']);
    this.splitSearchRequest(item);
    return item;
  }

  private splitSearchRequest(request: any): void {
    const keys: (keyof IInterventionSearchRequest)[] = [
      'id',
      'programBookId',
      'programId',
      'interventionTypeId',
      'workTypeId',
      'requestorId',
      'boroughId',
      'status',
      'assetId',
      'assetTypeId',
      'assetOwnerId',
      'executorId',
      'medalId'
    ];
    keys.forEach(k => {
      if (request[k] && !Array.isArray(request[k])) {
        request[k] = (request[k] as string).split(',');
      }
    });
  }
}

export const interventionSearchRequestSanitizer = new InterventionSearchRequestSanitizer();
