import { IEnrichedUserPreference } from '@villemontreal/agir-work-planning-lib/dist/src';

import { BaseSanitizer } from './baseSanitizer';

class UserPreferenceSanitizer extends BaseSanitizer<IEnrichedUserPreference> {
  public sanitize(userPreference: IEnrichedUserPreference): IEnrichedUserPreference {
    delete (userPreference as any).id;
    return userPreference;
  }
}
export const userPreferenceSanitizer = new UserPreferenceSanitizer();
