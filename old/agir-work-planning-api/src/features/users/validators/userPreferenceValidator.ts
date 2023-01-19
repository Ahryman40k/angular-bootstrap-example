import { IApiError, IPlainUserPreference } from '@villemontreal/agir-work-planning-lib';

import { createInvalidInputError } from '../../../utils/errorUtils';
import { BaseValidator } from '../../../validators/baseValidator';
import { db } from '../../database/DB';
import { UserPreferenceModel } from '../mongo/userPreferenceModel';

export interface IUserPreferenceValidator {
  validateInputForUpsert(input: IPlainUserPreference): Promise<void>;
}

class UserPreferenceValidator extends BaseValidator<IPlainUserPreference> implements IUserPreferenceValidator {
  protected get model(): UserPreferenceModel {
    return db().models.UserPreference;
  }

  protected getOpenApiModelName(userPreference: IPlainUserPreference) {
    return 'PlainUserPreference';
  }

  public async validateInputForUpsert(userPreference: IPlainUserPreference): Promise<void> {
    const inputErrors: IApiError[] = [];
    await this.validateOpenApiModel(inputErrors, userPreference);
    if (inputErrors.length) {
      throw createInvalidInputError('The data input is incorrect!!', inputErrors);
    }
  }
}

export const userPreferenceValidator = new UserPreferenceValidator();
