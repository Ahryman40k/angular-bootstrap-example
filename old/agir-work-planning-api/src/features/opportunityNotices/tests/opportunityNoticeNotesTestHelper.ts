import { IEnrichedNote, IPlainNote } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';

import { NOT_FOUND_UUID } from '../../../../tests/utils/testHelper';
import { assertAudit, getAudit } from '../../audit/test/auditTestHelper';
import { IOpportunityNoticeNoteProps } from '../models/notes/opportunityNoticeNote';
import { ICreateOpportunityNoticeNoteCommandProps } from '../useCases/notes/createOpportunityNoticeNote/createOpportunityNoticeNoteCommand';
import { IUpdateOpportunityNoticeNoteCommandProps } from '../useCases/notes/updateOpportunityNoticeNote/updateOpportunityNoticeNoteCommand';

export function getPlainNote(text?: string): IPlainNote {
  return text ? { text } : { text: 'Plain note' };
}

export function getEnrichedNote(text?: string): IOpportunityNoticeNoteProps {
  return {
    ...getPlainNote(text || 'Enriched note'),
    audit: getAudit()
  };
}

export function getCreateOpportunityNoticeNoteCommandProps(
  props?: Partial<ICreateOpportunityNoticeNoteCommandProps>
): ICreateOpportunityNoticeNoteCommandProps {
  return {
    ...getPlainNote(),
    opportunityNoticeId: NOT_FOUND_UUID, // But valid UUID
    ...props
  };
}

export function getUpdateOpportunityNoticeNoteCommandProps(
  props?: Partial<IUpdateOpportunityNoticeNoteCommandProps>
): IUpdateOpportunityNoticeNoteCommandProps {
  return {
    ...getPlainNote(),
    id: NOT_FOUND_UUID,
    opportunityNoticeNoteId: NOT_FOUND_UUID,
    ...props
  };
}

export function assertOpportunityNoticeNotes(actuals: IEnrichedNote[], expecteds: Partial<IEnrichedNote>[]) {
  actuals.forEach((actual, idx) => {
    assert.strictEqual(actual.text, expecteds[idx].text);
    assertAudit(actual.audit);
  });
}
