import { ISubmission } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';

import { constants, EndpointTypes } from '../../../../../config/constants';
import { userMocks } from '../../../../../tests/data/userMocks';
import { requestService } from '../../../../../tests/utils/requestService';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { TimeUnits } from '../../../../utils/moment/moment.enum';
import { MomentUtils } from '../../../../utils/moment/momentUtils';
import { appUtils } from '../../../../utils/utils';
import { Submission } from '../../models/submission';
import { createAndSaveSubmission, DRM_NUMBER, getSubmissionPatchRequestProps } from '../submissionTestHelper';

describe('PatchSubmissionController', () => {
  const apiUrl = appUtils.createPublicFullPath(constants.locationPaths.SUBMISSIONS, EndpointTypes.API);
  let submission: Submission;
  const submissionPatchRequest = getSubmissionPatchRequestProps({
    progressStatusChangeDate: MomentUtils.add(new Date(), 7, TimeUnits.DAY).toISOString()
  });
  beforeEach(async () => {
    submission = await createAndSaveSubmission();
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/submissions > PATCH', () => {
    it(`Positive - Should patch a submission`, async () => {
      userMocker.mock(userMocks.admin);
      const response = await requestService.patch(`${apiUrl}/${submission.submissionNumber}`, {
        body: submissionPatchRequest
      });
      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const patchedSubmission: ISubmission = response.body;
      assert.strictEqual(patchedSubmission.submissionNumber, submission.submissionNumber);
      assert.strictEqual(patchedSubmission.drmNumber, DRM_NUMBER);
      assert.strictEqual(patchedSubmission.submissionNumber, submissionPatchRequest.submissionNumber);
      assert.strictEqual(patchedSubmission.programBookId, submission.programBookId, `should not be modified`);
      assert.isTrue(
        patchedSubmission.projectIds.every(() => submission.projectIds.map(i => i)),
        `should not be modified`
      );
      assert.strictEqual(patchedSubmission.status, submissionPatchRequest.status);
      assert.strictEqual(patchedSubmission.progressStatus, submissionPatchRequest.progressStatus);
      assert.strictEqual(patchedSubmission.progressHistory.length, 2);
      assert.isDefined(patchedSubmission.audit);
    });

    [
      {
        description: 'requestor',
        user: userMocks.requestor
      }
    ].forEach(test => {
      it(`should return forbidden error when ${test.description} tries to patch a submission`, async () => {
        userMocker.mock(test.user);
        const response = await requestService.patch(`${apiUrl}/${submission.submissionNumber}`, {
          body: submissionPatchRequest
        });
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      });
    });
  });
});
