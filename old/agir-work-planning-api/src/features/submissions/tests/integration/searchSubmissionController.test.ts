import { ISubmission } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';

import { constants, EndpointTypes } from '../../../../../config/constants';
import { userMocks } from '../../../../../tests/data/userMocks';
import { requestService } from '../../../../../tests/utils/requestService';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { appUtils, IPaginatedResult } from '../../../../utils/utils';
import { submissionRepository } from '../../mongo/submissionRepository';
import { DRM_NUMBER, getSubmission } from '../submissionTestHelper';

describe('SearchSubmissionController', () => {
  const apiUrl = appUtils.createPublicFullPath(`${constants.locationPaths.SUBMISSIONS}/search`, EndpointTypes.API);

  beforeEach(async () => {
    await submissionRepository.saveBulk([
      getSubmission(),
      getSubmission({
        submissionNumber: `${DRM_NUMBER}02`
      })
    ]);
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/submission/search > POST', () => {
    it(`Positive - Should search for submissions`, async () => {
      const response = await requestService.post(apiUrl, {
        body: {
          drmNumber: DRM_NUMBER
        }
      });

      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const responseBody: IPaginatedResult<ISubmission> = response.body;
      assert.property(responseBody, 'paging');
      assert.property(responseBody, 'items');
      assert.strictEqual(responseBody.items.length, 2);
      const firstFound = responseBody.items.find(s => s);
      const fields = [
        'submissionNumber',
        'drmNumber',
        'programBookId',
        'projectIds',
        'status',
        'progressHistory',
        'audit'
      ];
      for (const field of fields) {
        assert.isDefined(firstFound[field]);
      }
      assert.strictEqual(firstFound.drmNumber, DRM_NUMBER);
    });

    [
      {
        description: 'partnerProjectConsultation',
        user: userMocks.partnerProjectConsultation
      }
    ].forEach(test => {
      it(`should return forbidden error when search by ${test.description}`, async () => {
        userMocker.mock(test.user);
        const response = await requestService.post(apiUrl, {});
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      });
    });
  });
});
