import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IEnrichedProject, ProjectType } from '@villemontreal/agir-work-planning-lib';
import { IEnrichedNote, IPlainNote, OpportunityNoticeStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { getAllOtherRoles, normalizeUsernames, userMocks } from '../../../../../../tests/data/userMocks';
import { destroyDBTests } from '../../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../../tests/utils/userUtils';
import { createAndSaveProject } from '../../../../projects/tests/projectTestHelper';
import { OpportunityNotice } from '../../../models/opportunityNotice';
import { opportunityNoticeRepository } from '../../../mongo/opportunityNoticeRepository';
import { opportunityNoticeNotesTestClient } from '../../opportunityNoticeNotesTestClient';
import { assertOpportunityNoticeNotes, getPlainNote } from '../../opportunityNoticeNotesTestHelper';
import { getEnrichedOpportunityNotice, getOpportunityNotice } from '../../opportunityNoticeTestHelper';

const writeAllowedRoles = normalizeUsernames([userMocks.admin, userMocks.pilot, userMocks.planner]);

describe('CreateOpportunityNoticeNoteTestController', () => {
  let opportunityNotice: OpportunityNotice;
  let plainNote: IPlainNote;
  let project: IEnrichedProject;
  beforeEach(async () => {
    userMocker.mock(userMocks.planner);
    project = await createAndSaveProject({ projectTypeId: ProjectType.integrated });
    opportunityNotice = (
      await opportunityNoticeRepository.save(
        getOpportunityNotice(getEnrichedOpportunityNotice({ projectId: project.id }))
      )
    ).getValue();
    plainNote = getPlainNote();
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/v1/opportunityNotices/:id/notes - POST', () => {
    describe('Positive', () => {
      it('Should create note with its required information', async () => {
        const response = await opportunityNoticeNotesTestClient.post(opportunityNotice.id, plainNote);
        assert.strictEqual(response.status, HttpStatusCodes.CREATED);
        const myOpportunityNoticeNotes: IEnrichedNote[] = response.body.notes;
        assertOpportunityNoticeNotes([myOpportunityNoticeNotes[1]], opportunityNotice.notes);
      });
    });
  });

  describe('Negative', () => {
    it('should not create note when the user does not have the authorizations', async () => {
      for (const role of getAllOtherRoles(writeAllowedRoles)) {
        userMocker.mock(role);
        const response = await opportunityNoticeNotesTestClient.post(opportunityNotice.id, plainNote);
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      }
    });

    it('should not create note with blank text', async () => {
      const response = await opportunityNoticeNotesTestClient.post(opportunityNotice.id, {
        ...plainNote,
        text: ''
      });
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.strictEqual(response.body.error.code, 'invalidParameter');
      assert.deepInclude(response.body.error.details, {
        code: 'InvalidInput',
        message: 'text is empty',
        target: 'text'
      });
    });

    it('should not create note when the opportunity notice status is closed', async () => {
      const opportunityNoticeClosedStatus: OpportunityNotice = (
        await opportunityNoticeRepository.save(
          getOpportunityNotice({
            status: OpportunityNoticeStatus.closed,
            projectId: project.id
          })
        )
      ).getValue();
      const response = await opportunityNoticeNotesTestClient.post(opportunityNoticeClosedStatus.id, plainNote);
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      assert.strictEqual(response.body.error.code, 'unprocessableEntity');
      assert.deepInclude(response.body.error.target, {
        code: 'BusinessRule',
        message: 'cant add or update note when opportunity notice is closed',
        succeeded: false,
        target: 'opportunityNotice.status'
      });
    });
  });
});
