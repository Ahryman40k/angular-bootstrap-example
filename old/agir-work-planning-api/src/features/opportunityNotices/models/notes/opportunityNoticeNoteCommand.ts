import { IPlainNote } from '@villemontreal/agir-work-planning-lib/dist/src';
import { IGuardResult } from '../../../../shared/logic/guard';
import { PlainOpportunityNoticeNote } from './plainOpportunityNoticeNote';

// tslint:disable:no-empty-interface
export interface IOpportunityNoticeNoteCommandProps extends IPlainNote {}

export abstract class OpportunityNoticeNoteCommand<
  P extends IOpportunityNoticeNoteCommandProps
> extends PlainOpportunityNoticeNote<P> {
  public static guard(props: IOpportunityNoticeNoteCommandProps): IGuardResult {
    // Minimalement pour créer une opportunityNoticeCmd (create ou update) on doit avoir un plain notice valide right ?
    return PlainOpportunityNoticeNote.guard(props);
  }
}
