import { IEnrichedOpportunityNotice } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { UpdateController } from '../../../../../shared/controllers/updateController';
import { IUpdateOpportunityNoticeNoteCommandProps } from './updateOpportunityNoticeNoteCommand';
import {
  UpdateOpportunityNoticeNoteUseCase,
  updateOpportunityNoticeNoteUseCase
} from './updateOpportunityNoticeNoteUseCase';

@autobind
export class UpdateOpportunityNoticeNoteController extends UpdateController<
  IUpdateOpportunityNoticeNoteCommandProps,
  IEnrichedOpportunityNotice
> {
  protected readonly useCase: UpdateOpportunityNoticeNoteUseCase = updateOpportunityNoticeNoteUseCase;
  protected reqToInput(req: express.Request): IUpdateOpportunityNoticeNoteCommandProps {
    return {
      ...req.body,
      id: req.params.id,
      opportunityNoticeNoteId: req.params.noteId
    };
  }
}
