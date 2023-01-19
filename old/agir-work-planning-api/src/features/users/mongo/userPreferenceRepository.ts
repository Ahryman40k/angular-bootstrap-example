import { IEnrichedUserPreference } from '@villemontreal/agir-work-planning-lib/dist/src';

import { BaseRepository } from '../../../repositories/core/baseRepository';
import { IUserPreferenceRepository } from '../iUserPreferenceRepository';
import { IUserPreferenceCriterias, UserPreferenceFindOptions } from '../models/userPreferenceFindOptions';
import { userPreferencesMatchBuilder } from '../userPreferencesMatchBuilder';
import { IUserPreferenceMongoDocument, UserPreferenceModel } from './userPreferenceModel';

/**
 * User Preference repository, based on Mongo/Mongoose.
 */
class UserPreferenceRepository
  extends BaseRepository<IEnrichedUserPreference, IUserPreferenceMongoDocument, UserPreferenceFindOptions>
  implements IUserPreferenceRepository {
  public get model(): UserPreferenceModel {
    return this.db.models.UserPreference;
  }

  protected async getMatchFromQueryParams(criterias: IUserPreferenceCriterias): Promise<any> {
    return userPreferencesMatchBuilder.getMatchFromQueryParams(criterias);
  }
}

export const userPreferenceRepository: IUserPreferenceRepository = new UserPreferenceRepository();
