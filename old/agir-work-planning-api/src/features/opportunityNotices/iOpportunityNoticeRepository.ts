import { IBaseRepository } from '../../repositories/core/baseRepository';
import { OpportunityNotice } from './models/opportunityNotice';
import { OpportunityNoticeFindOptions } from './models/opportunityNoticeFindOptions';

export interface IOpportunityNoticeRepository
  extends IBaseRepository<OpportunityNotice, OpportunityNoticeFindOptions> {}
