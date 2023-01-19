import { IEnrichedOpportunityNotice } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { GetByIdController } from '../../../../shared/controllers/getByIdController';
import { OpportunityNotice } from '../../models/opportunityNotice';
import { OpportunityNoticeFindOptions } from '../../models/opportunityNoticeFindOptions';
import { getOpportunityNoticeUseCase, GetOpportunityNoticeUseCase } from './getOpportunityNoticeUseCase';

@autobind
export class GetOpportunityNoticeController extends GetByIdController<
  OpportunityNotice,
  IEnrichedOpportunityNotice,
  OpportunityNoticeFindOptions
> {
  protected useCase: GetOpportunityNoticeUseCase = getOpportunityNoticeUseCase;
}
