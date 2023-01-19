import { IEnrichedOpportunityNotice } from '@villemontreal/agir-work-planning-lib';
import { SearchUseCase } from '../../../../shared/domain/useCases/searchUseCase/searchUseCase';
import { Result } from '../../../../shared/logic/result';
import { getAssetMapperExpandOptions } from '../../../asset/mappers/assetMapperDTO';
import { IOpportunityNoticeRepository } from '../../iOpportunityNoticeRepository';
import { IOpportunityNoticeMapperOptions, opportunityNoticeMapperDTO } from '../../mappers/opportunityNoticeMapperDTO';
import { OpportunityNotice } from '../../models/opportunityNotice';
import {
  IOpportunityNoticePaginatedFindOptionsProps,
  OpportunityNoticeFindPaginatedOptions
} from '../../models/opportunityNoticeFindPaginatedOptions';
import { opportunityNoticeRepository } from '../../mongo/opportunityNoticeRepository';

export class SearchOpportunityNoticeUseCase extends SearchUseCase<
  OpportunityNotice,
  IEnrichedOpportunityNotice,
  IOpportunityNoticePaginatedFindOptionsProps
> {
  protected entityRepository: IOpportunityNoticeRepository = opportunityNoticeRepository;
  protected mapper = opportunityNoticeMapperDTO;

  protected createCommand(
    req: IOpportunityNoticePaginatedFindOptionsProps
  ): Result<OpportunityNoticeFindPaginatedOptions> {
    return OpportunityNoticeFindPaginatedOptions.create(req);
  }

  protected getMapperOptions(findOptions: OpportunityNoticeFindPaginatedOptions): IOpportunityNoticeMapperOptions {
    return {
      ...super.getMapperOptions(findOptions),
      expand: getAssetMapperExpandOptions(findOptions.expandOptions.map(expand => expand.field))
    };
  }
}

export const searchOpportunityNoticeUseCase = new SearchOpportunityNoticeUseCase();
