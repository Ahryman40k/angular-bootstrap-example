import { IEnrichedOpportunityNotice } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { UpdateController } from '../../../../shared/controllers/updateController';
import { UpdateOpportunityNoticeUseCase, updateOpportunityNoticeUseCase } from './updateOpportunityNoticeUseCase';

@autobind
export class UpdateOpportunityNoticeController extends UpdateController<any, IEnrichedOpportunityNotice> {
  protected readonly useCase: UpdateOpportunityNoticeUseCase = updateOpportunityNoticeUseCase;
}
