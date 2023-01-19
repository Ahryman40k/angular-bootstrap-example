import { IInterventionPaginatedSearchRequest } from '@villemontreal/agir-work-planning-lib/dist/src';

import { parseIntKeys } from '../utils/numberUtils';
import { InterventionSearchRequestSanitizer } from './interventionSearchRequestSanitizer';

class InterventionPaginatedSearchRequestSanitizer extends InterventionSearchRequestSanitizer {
  /**
   * Sanitizes the intervention search request.
   * Converts string params to number.
   * @param item The intervention search request.
   */
  public sanitize(item: IInterventionPaginatedSearchRequest): IInterventionPaginatedSearchRequest {
    if (!item) {
      return item;
    }
    super.sanitize(item);
    parseIntKeys(item, ['limit', 'offset']);
    return item;
  }
}

export const interventionPaginatedSearchRequestSanitizer = new InterventionPaginatedSearchRequestSanitizer();
