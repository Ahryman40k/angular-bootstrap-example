import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IEnrichedProject, ProjectType } from '@villemontreal/agir-work-planning-lib';
import { IPlainNote, OpportunityNoticeStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { getAllOtherRoles, normalizeUsernames, userMocks } from '../../../../../../tests/data/userMocks';
import { destroyDBTests, NOT_FOUND_UUID } from '../../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../../tests/utils/userUtils';
import { createAndSaveProject } from '../../../../projects/tests/projectTestHelper';
import { OpportunityNotice } from '../../../models/opportunityNotice';
import { opportunityNoticeRepository } from '../../../mongo/opportunityNoticeRepository';
import { opportunityNoticeNotesTestClient } from '../../opportunityNoticeNotesTestClient';
import { assertOpportunityNoticeNotes } from '../../opportunityNoticeNotesTestHelper';
import { getEnrichedOpportunityNotice, getOpportunityNotice } from '../../opportunityNoticeTestHelper';

const FIRST_NOTE = 0;

describe('UpdateOpportunityNoticeNoteTestController', () => {
  let project: IEnrichedProject;
  let opportunityNotice: OpportunityNotice;
  let plainNote: IPlainNote;

  beforeEach(async () => {
    project = await createAndSaveProject({ projectTypeId: ProjectType.integrated });
    userMocker.mock(userMocks.planner);
    plainNote = { text: 'Updated Note' };
    opportunityNotice = (
      await opportunityNoticeRepository.save(
        getOpportunityNotice(getEnrichedOpportunityNotice({ projectId: project.id }))
      )
    ).getValue();
  });

  afterEach(async () => {
    userMocker.reset();
    await destroyDBTests();
  });

  describe('/v1/opportunityNotices/:id/notes/:noteId - PUT', () => {
    it('Positive - should update a note from an opportunityNotice', async () => {
      const response = await opportunityNoticeNotesTestClient.put(
        opportunityNotice.id,
        opportunityNotice.notes[FIRST_NOTE].id,
        plainNote
      );
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assertOpportunityNoticeNotes(response.body.notes, [plainNote]);
    });

    it('Negative - should not update note when note id is invalid', async () => {
      const invalidNoteId = NOT_FOUND_UUID;
      const response = await opportunityNoticeNotesTestClient.put(opportunityNotice.id, invalidNoteId, plainNote);
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it('Negative - should not update note when opportunity notice id is invalid', async () => {
      const invalidOpportunityNoticeId = NOT_FOUND_UUID;
      const response = await opportunityNoticeNotesTestClient.put(
        invalidOpportunityNoticeId,
        opportunityNotice.notes[FIRST_NOTE].id,
        plainNote
      );
      assert.strictEqual(response.status, HttpStatusCodes.NOT_FOUND);
    });

    it('Negative - should not update note with blank text', async () => {
      plainNote = { text: '' };
      const response = await opportunityNoticeNotesTestClient.put(
        opportunityNotice.id,
        opportunityNotice.notes[FIRST_NOTE].id,
        plainNote
      );
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
      assert.strictEqual(response.body.error.code, 'invalidParameter');
    });

    it('Negative - should not update note when the opportunity notice status is closed', async () => {
      const opportunityNoticeClosedStatus: OpportunityNotice = (
        await opportunityNoticeRepository.save(
          getOpportunityNotice({
            status: OpportunityNoticeStatus.closed,
            projectId: project.id
          })
        )
      ).getValue();
      const response = await opportunityNoticeNotesTestClient.put(
        opportunityNoticeClosedStatus.id,
        opportunityNoticeClosedStatus.notes[FIRST_NOTE].id,
        plainNote
      );
      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
      assert.strictEqual(response.body.error.code, 'unprocessableEntity');
    });

    it('Negative - should not update note when the user does not have the authorizations', async () => {
      const writeAllowedRoles = normalizeUsernames([userMocks.admin, userMocks.pilot, userMocks.planner]);
      for (const role of getAllOtherRoles(writeAllowedRoles)) {
        userMocker.mock(role);
        const response = await opportunityNoticeNotesTestClient.post(opportunityNotice.id, plainNote);
        assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
      }
    });
  });
});
