import { IEnrichedProject, ISubmission, ProjectStatus, SubmissionStatus } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as HttpStatusCodes from 'http-status-codes';

import { constants, EndpointTypes } from '../../../../../config/constants';
import { userMocks } from '../../../../../tests/data/userMocks';
import { requestService } from '../../../../../tests/utils/requestService';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { appUtils } from '../../../../utils/utils';
import { createAndSaveProject } from '../../../projects/tests/projectTestHelper';
import { submissionMapperDTO } from '../../mappers/submissionMapperDTO';
import { Submission } from '../../models/submission';
import {
  assertSubmissions,
  createAndSaveSubmission,
  getProjectSubmissionCommandProps,
  SUBMISSION_NUMBER
} from '../submissionTestHelper';

describe('ProjectSubmissionController', () => {
  const apiUrl = appUtils.createPublicFullPath(constants.locationPaths.SUBMISSIONS, EndpointTypes.API);
  let submission: Submission;
  let project: IEnrichedProject;
  const projectSubmissionCmd = getProjectSubmissionCommandProps();
  const submissionNumber = SUBMISSION_NUMBER;
  const projectId = 'P00020';
  beforeEach(async () => {
    submission = await createAndSaveSubmission({
      projectIds: ['P00019', projectId],
      status: SubmissionStatus.VALID,
      submissionNumber
    });
    project = await createAndSaveProject(
      {
        drmNumber: submission.drmNumber,
        status: ProjectStatus.finalOrdered
      },
      submission.programBookId
    );
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  describe('Positive', () => {
    [
      {
        action: 'add'
      },
      {
        action: 'remove'
      }
    ].forEach(test => {
      it(`Positive - /submissions/:submissionNumber/${test.action}/project/:id > POST`, async () => {
        userMocker.mock(userMocks.admin);
        const projectIdAction = test.action === 'add' ? project.id : projectId;
        const response = await requestService.post(
          `${apiUrl}/${submission.submissionNumber}/${test.action}/project/${projectIdAction}`,
          {
            body: projectSubmissionCmd
          }
        );
        assert.strictEqual(response.status, HttpStatusCodes.OK);
        const updatedSubmission: ISubmission = response.body;
        // expected submission is same as before except for projectIds
        let expectedProjectIds: string[];
        if (test.action === 'add') {
          expectedProjectIds = [...submission.projectIds, project.id];
        } else if (test.action === 'remove') {
          expectedProjectIds = submission.projectIds.filter(pid => pid !== projectId);
        }
        const expectedSubmission = await submissionMapperDTO.getFromModel(
          Submission.create({
            ...submission.props,
            projectIds: expectedProjectIds
          }).getValue()
        );
        assertSubmissions(updatedSubmission, expectedSubmission);
      });
    });
  });

  describe('Negative - Forbidden - partnerProjectConsultation', () => {
    [
      {
        action: 'add'
      },
      {
        action: 'remove'
      }
    ].forEach(test => {
      it(`should return forbidden error when tries to ${test.action} project submission`, async () => {
        userMocker.mock(userMocks.partnerProjectConsultation);
        const route = `${apiUrl}/${submissionNumber}/${test.action}/project/${projectId}`;
        const response = await requestService.post(route, { body: projectSubmissionCmd });
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      });
    });
  });
});
