import { IPlainNote } from '@villemontreal/agir-work-planning-lib/dist/src';

import { Guard } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { Audit } from '../../../audit/audit';
import { Auditable, IAuditableProps } from '../../../audit/auditable';
import { IOpportunityNoticeNoteAttributes } from '../../mongo/opportunityNoticeSchema';
import { PlainOpportunityNoticeNote } from './plainOpportunityNoticeNote';

// tslint:disable:no-empty-interface
export interface IOpportunityNoticeNoteProps extends IPlainNote, IAuditableProps {}

export class OpportunityNoticeNote extends Auditable(PlainOpportunityNoticeNote)<IOpportunityNoticeNoteProps> {
  public static create(props: IOpportunityNoticeNoteProps, id?: string): Result<OpportunityNoticeNote> {
    const guardPlain = PlainOpportunityNoticeNote.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guardResult = Guard.combine([guardPlain, guardAudit]);
    if (!guardResult.succeeded) {
      return Result.fail<OpportunityNoticeNote>(guardResult);
    }
    const opportunity = new OpportunityNoticeNote(props, id);
    return Result.ok<OpportunityNoticeNote>(opportunity);
  }

  public static async toDomainModelBulk(
    rawNotes: IOpportunityNoticeNoteAttributes[]
  ): Promise<OpportunityNoticeNote[]> {
    return Promise.all(rawNotes.map(async (rawNote: any) => this.toDomainModel(rawNote)));
  }

  protected static async toDomainModel(raw: IOpportunityNoticeNoteAttributes): Promise<OpportunityNoticeNote> {
    const noteProps: IOpportunityNoticeNoteProps = {
      text: raw.text,
      audit: await Audit.toDomainModel(raw.audit)
    };
    // TODO remove after refactor aggregagterooot
    return OpportunityNoticeNote.create(noteProps, raw._id).getValue();
  }

  public static toPersistanceBulk(notes: OpportunityNoticeNote[]): IOpportunityNoticeNoteAttributes[] {
    return notes.map(note => this.toPersistance(note));
  }

  public static toPersistance(note: OpportunityNoticeNote): IOpportunityNoticeNoteAttributes {
    return {
      _id: note.id,
      text: note.text,
      audit: Audit.toPersistance(note.audit)
    };
  }
}
