import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';

import { SubmissionProgressStatus, SubmissionStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants, EndpointTypes } from '../../../../../config/constants';
import { requestService } from '../../../../../tests/utils/requestService';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { appUtils } from '../../../../utils/utils';
import { submissionRepository } from '../../mongo/submissionRepository';
import { DRM_NUMBER, getSubmission } from '../submissionTestHelper';

describe('CountBySubmissionController', () => {
  const apiUrl = appUtils.createPublicFullPath(`${constants.locationPaths.SUBMISSIONS}/countBy`, EndpointTypes.API);

  beforeEach(async () => {
    await submissionRepository.saveBulk([
      getSubmission(),
      getSubmission({
        submissionNumber: `${DRM_NUMBER}02`
      }),
      getSubmission({
        submissionNumber: `${DRM_NUMBER}03`
      }),
      getSubmission({
        submissionNumber: `${DRM_NUMBER}04`,
        status: SubmissionStatus.INVALID,
        progressStatus: SubmissionProgressStatus.DESIGN
      })
    ]);
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/submission/countBy > GET', () => {
    [
      {
        query: { countBy: 'status', drmNumber: DRM_NUMBER },
        title: 'status',
        expected: [
          { id: SubmissionStatus.INVALID, count: 1 },
          { id: SubmissionStatus.VALID, count: 3 }
        ]
      },
      {
        query: { countBy: 'progressStatus', drmNumber: DRM_NUMBER },
        title: 'progressStatus',
        expected: [
          { id: SubmissionProgressStatus.DESIGN, count: 1 },
          { id: SubmissionProgressStatus.PRELIMINARY_DRAFT, count: 3 }
        ]
      }
    ].forEach(el => {
      it(`Positive - Should count submissions by ${el.title}`, async () => {
        const response = await requestService.get(apiUrl, {}, el.query);
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        assert.deepEqual(response.body, el.expected);
      });
    });
  });
});
