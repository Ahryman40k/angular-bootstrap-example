import { IEnrichedUserPreference, IPlainUserPreference } from '@villemontreal/agir-work-planning-lib';

import { auditService } from '../../services/auditService';
import { userService } from '../../services/userService';

export interface IUserPreferenceService {
  createUserPreference(
    input: IPlainUserPreference,
    userPreferenceName: string,
    originalUserPreference?: IEnrichedUserPreference
  ): IEnrichedUserPreference;
}

class UserPreferenceService implements IUserPreferenceService {
  /**
   * Creates user preference with validated input.
   * @param input The input data.
   */
  public createUserPreference(input: IPlainUserPreference, key: string): IEnrichedUserPreference {
    const user = userService.currentUser;
    return {
      audit: auditService.buildAudit(),
      key,
      userId: user.userName,
      value: input.value || null
    };
  }

  public updateUserPreference(userPreference: IEnrichedUserPreference, input: IPlainUserPreference): void {
    userPreference.value = input.value;
    userPreference.audit = auditService.buildAudit(userPreference.audit);
  }
}

export const userPreferenceService = new UserPreferenceService();
