import { IEnrichedOpportunityNotice } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { CreateController } from '../../../../shared/controllers/createController';
import { IPlainOpportunityNoticeProps } from '../../models/plainOpportunityNotice';
import { CreateOpportunityNoticeUseCase, createOpportunityNoticeUseCase } from './createOpportunityNoticeUseCase';

@autobind
export class CreateOpportunityNoticeController extends CreateController<
  IPlainOpportunityNoticeProps,
  IEnrichedOpportunityNotice
> {
  protected readonly useCase: CreateOpportunityNoticeUseCase = createOpportunityNoticeUseCase;
}
