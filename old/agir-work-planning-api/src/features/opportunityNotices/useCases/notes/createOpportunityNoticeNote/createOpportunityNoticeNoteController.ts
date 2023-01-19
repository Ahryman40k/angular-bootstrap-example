import { IEnrichedOpportunityNotice } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { CreateController } from '../../../../../shared/controllers/createController';
import { ICreateOpportunityNoticeNoteCommandProps } from './createOpportunityNoticeNoteCommand';
import {
  CreateOpportunityNoticeNoteUseCase,
  createOpportunityNoticeNoteUseCase
} from './createOpportunityNoticeNoteUseCase';

@autobind
export class CreateOpportunityNoticeNoteController extends CreateController<
  ICreateOpportunityNoticeNoteCommandProps,
  IEnrichedOpportunityNotice
> {
  protected readonly useCase: CreateOpportunityNoticeNoteUseCase = createOpportunityNoticeNoteUseCase;
  protected reqToInput(req: express.Request): ICreateOpportunityNoticeNoteCommandProps {
    return {
      ...super.reqToInput(req),
      opportunityNoticeId: req.params.id
    };
  }
}
