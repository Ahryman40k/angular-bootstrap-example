import {
  IEnrichedProject,
  ISubmission,
  ISubmissionCreateRequest,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';

import { constants, EndpointTypes } from '../../../../../config/constants';
import { userMocks } from '../../../../../tests/data/userMocks';
import { requestService } from '../../../../../tests/utils/requestService';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { appUtils } from '../../../../utils/utils';
import { ProgramBook } from '../../../programBooks/models/programBook';
import { createAndSaveDefaultProgramBook } from '../../../programBooks/tests/programBookTestHelper';
import { createAndSaveProject } from '../../../projects/tests/projectTestHelper';
import { DRM_NUMBER, getSubmissionCreateRequestProps } from '../submissionTestHelper';

describe('CreateSubmissionController', () => {
  const apiUrl = appUtils.createPublicFullPath(constants.locationPaths.SUBMISSIONS, EndpointTypes.API);
  let programBook: ProgramBook;
  let project1: IEnrichedProject;
  let project2: IEnrichedProject;
  let submissionCreateRequest: ISubmissionCreateRequest;

  beforeEach(async () => {
    programBook = await createAndSaveDefaultProgramBook();
    [project1, project2] = await Promise.all(
      [project1, project2].map(() =>
        createAndSaveProject(
          {
            status: ProjectStatus.finalOrdered,
            drmNumber: DRM_NUMBER
          },
          programBook.id
        )
      )
    );
    submissionCreateRequest = getSubmissionCreateRequestProps({
      programBookId: programBook.id,
      projectIds: [project1.id, project2.id]
    });
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/submissions > POST', () => {
    it(`Positive - Should create a submission`, async () => {
      userMocker.mock(userMocks.admin);
      const response = await requestService.post(apiUrl, { body: submissionCreateRequest });

      assert.strictEqual(response.status, HttpStatusCodes.CREATED);
      const submission: ISubmission = response.body;
      assert.strictEqual(submission.submissionNumber, `${DRM_NUMBER}01`);
      assert.strictEqual(submission.drmNumber, DRM_NUMBER);
      assert.strictEqual(submission.programBookId, programBook.id);
      assert.isTrue(submission.projectIds.every(() => [project1, project2].map(p => p.id)));
      assert.isDefined(submission.audit);
    });

    [
      {
        description: 'requestor',
        user: userMocks.requestor
      }
    ].forEach(test => {
      it(`should return forbidden error when ${test.description} tries to create a submission`, async () => {
        userMocker.mock(test.user);
        const response = await requestService.post(apiUrl, { body: submissionCreateRequest });
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      });
    });
  });
});
