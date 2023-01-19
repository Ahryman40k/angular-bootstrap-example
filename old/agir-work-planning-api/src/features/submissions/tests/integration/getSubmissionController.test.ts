import { ISubmission } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';

import { constants, EndpointTypes } from '../../../../../config/constants';
import { userMocks } from '../../../../../tests/data/userMocks';
import { requestService } from '../../../../../tests/utils/requestService';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { appUtils } from '../../../../utils/utils';
import { submissionMapperDTO } from '../../mappers/submissionMapperDTO';
import { Submission } from '../../models/submission';
import { assertSubmissions, createAndSaveSubmission } from '../submissionTestHelper';

describe('GetSubmissionController', () => {
  const apiUrl = appUtils.createPublicFullPath(constants.locationPaths.SUBMISSIONS, EndpointTypes.API);
  let submission: Submission;
  beforeEach(async () => {
    submission = await createAndSaveSubmission();
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/submissions/:submissionNumber > GET', () => {
    it(`Positive - Should retrieve a submission`, async () => {
      userMocker.mock(userMocks.admin);
      const response = await requestService.get(`${apiUrl}/${submission.submissionNumber}`);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      const retrievedSubmission: ISubmission = response.body;
      const expectedSubmissionDTO: ISubmission = await submissionMapperDTO.getFromModel(submission);

      assertSubmissions(retrievedSubmission, expectedSubmissionDTO);
    });

    [
      {
        description: 'partnerProjectConsultation',
        user: userMocks.partnerProjectConsultation
      }
    ].forEach(test => {
      it(`should return forbidden error when ${test.description} tries to retrieve a submission`, async () => {
        userMocker.mock(test.user);
        const response = await requestService.get(`${apiUrl}/${submission.submissionNumber}`);
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      });
    });
  });
});
