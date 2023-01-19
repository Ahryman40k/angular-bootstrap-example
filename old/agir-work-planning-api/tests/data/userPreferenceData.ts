import { IEnrichedUserPreference, IPlainUserPreference } from '@villemontreal/agir-work-planning-lib';

import { db } from '../../src/features/database/DB';
import { createAuthorMock } from './author.mocks';

class UserPreferenceData {
  public get enrichedUserPreference(): IEnrichedUserPreference {
    return {
      key: 'xtest',
      userId: 'xtest',
      value: {},
      audit: {
        createdAt: new Date().toISOString(),
        createdBy: createAuthorMock()
      }
    };
  }

  public get plainUserPreference(): IPlainUserPreference {
    return {
      value: {}
    };
  }

  public async createMockPreference(attribute?: any): Promise<IEnrichedUserPreference> {
    const mockUserPref = this.enrichedUserPreference;
    Object.assign(mockUserPref, attribute);
    const docs = await db().models.UserPreference.insertMany([mockUserPref]);
    return docs[0].toObject();
  }
}
export const userPreferenceData = new UserPreferenceData();
