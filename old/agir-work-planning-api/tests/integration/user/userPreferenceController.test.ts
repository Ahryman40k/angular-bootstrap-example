import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IEnrichedUserPreference, IPlainUserPreference } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as _ from 'lodash';

import { constants, EndpointTypes } from '../../../config/constants';
import { db } from '../../../src/features/database/DB';
import { UserPreferenceModel } from '../../../src/features/users/mongo/userPreferenceModel';
import { appUtils } from '../../../src/utils/utils';
import { userMocks } from '../../data/userMocks';
import { userPreferenceData } from '../../data/userPreferenceData';
import { requestService } from '../../utils/requestService';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

// tslint:disable: max-func-body-length
describe('UserPreference controller', () => {
  const apiUrl: string = appUtils.createPublicFullPath(constants.locationPaths.USERS_PREFERENCES, EndpointTypes.API);
  let userPreferenceModel: UserPreferenceModel;

  before(() => {
    userPreferenceModel = db().models.UserPreference;
  });

  after(async () => {
    await integrationAfter();
  });

  describe('/me/preferences/:key > PUT', () => {
    let mockPreference: IPlainUserPreference;
    beforeEach(() => {
      mockPreference = userPreferenceData.plainUserPreference;
    });
    afterEach(async () => {
      await userPreferenceModel.deleteMany({}).exec();
    });

    it('C59424 - Positive - Should create a new user preference', async () => {
      const response = await requestService.put(`${apiUrl}/test`, { body: mockPreference });
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
    });

    it('C59425 - Negative - Should reject user preference if no property value', async () => {
      delete mockPreference.value;
      const response = await requestService.put(`${apiUrl}/test`, { body: mockPreference });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C59426 - Positive - Should overwrite user preference if already exist', async () => {
      const response = await requestService.put(`${apiUrl}/test`, { body: mockPreference });
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
      const mockResult = await userPreferenceModel
        .find({
          key: 'test'
        })
        .exec();
      mockPreference.value = 'new value';
      const response2 = await requestService.put(`${apiUrl}/test`, { body: mockPreference });
      assert.strictEqual(response2.status, HttpStatusCodes.NO_CONTENT);
      const mockResult2 = await userPreferenceModel
        .find({
          key: 'test'
        })
        .exec();
      assert.strictEqual(mockResult[0].key, mockResult2[0].key);
      assert.notEqual(mockResult[0].value, mockResult2[0].value);
      assert.strictEqual(mockResult2[0].value, 'new value');
    });
  });

  describe('/me/preferences > GET', () => {
    const mockPreferences: IEnrichedUserPreference[] = [];
    const mockUser = userMocks.planner;
    beforeEach(async () => {
      userMocker.mock(mockUser);
      mockPreferences.push(await userPreferenceData.createMockPreference({ key: 'key1', userId: mockUser.userName }));
      mockPreferences.push(await userPreferenceData.createMockPreference({ key: 'key2', userId: mockUser.userName }));
      mockPreferences.push(await userPreferenceData.createMockPreference({ key: 'key3', userId: 'uchevol' }));
    });
    afterEach(async () => {
      await userPreferenceModel.deleteMany({}).exec();
      userMocker.reset();
    });

    it(`C59432 - Positive - Should get user preferences`, async () => {
      const response = await requestService.get(apiUrl);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isArray(response.body);
      const resultPreferences: IEnrichedUserPreference[] = response.body;
      assert.isTrue(resultPreferences.length > 0);

      const keys = mockPreferences.filter(x => x.userId === mockUser.userName).map(x => x.key);

      assert.isTrue(resultPreferences.every(userPref => userPref.userId === userMocks.planner.userName));
      assert.isTrue(resultPreferences.every(mockPreference => mockPreference.userId === mockUser.userName));
      assert.isTrue(resultPreferences.every(mockPreference => keys.includes(mockPreference.key)));
      assert.isTrue(resultPreferences.every(mockPreference => !_.has(mockPreference, 'value')));
      assert.isTrue(resultPreferences.every(mockPreference => !_.isEmpty(mockPreference.audit)));
      assert.isTrue(resultPreferences.every(mockPreference => _.isEmpty((mockPreference as any).id)));
    });
  });

  describe('/me/preferences/:key > DELETE', () => {
    let mockEnrichedUserPreference: IEnrichedUserPreference;

    before(async () => {
      await userPreferenceModel.deleteMany({}).exec();
    });
    beforeEach(async () => {
      userMocker.mock(userMocks.planner);
      mockEnrichedUserPreference = userPreferenceData.enrichedUserPreference;
      mockEnrichedUserPreference.key = 'test';
      mockEnrichedUserPreference.userId = userMocks.planner.userName;
      await userPreferenceModel.create(mockEnrichedUserPreference);
    });
    afterEach(async () => {
      await userPreferenceModel.deleteMany({}).exec();
      userMocker.reset();
    });

    it('C59475 - Positive - Should delete an existing user preference', async () => {
      const response = await requestService.delete(`${apiUrl}/test`);
      assert.strictEqual(response.status, HttpStatusCodes.NO_CONTENT);
    });

    it('C59476 - Negative - Should not delete an non existing user preference', async () => {
      const response = await requestService.delete(`${apiUrl}/test2`);
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });
  });
});
