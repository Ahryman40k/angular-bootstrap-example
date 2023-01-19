import { IEnrichedOpportunityNotice } from '@villemontreal/agir-work-planning-lib';

import { ByUuidCommand } from '../../../../shared/domain/useCases/byUuidCommand';
import { GetByUuidUseCase } from '../../../../shared/domain/useCases/getByIdUseCase/getByUuidUseCase';
import { Result } from '../../../../shared/logic/result';
import { getAssetMapperExpandOptions } from '../../../asset/mappers/assetMapperDTO';
import { IOpportunityNoticeRepository } from '../../iOpportunityNoticeRepository';
import { IOpportunityNoticeMapperOptions, opportunityNoticeMapperDTO } from '../../mappers/opportunityNoticeMapperDTO';
import { OpportunityNotice } from '../../models/opportunityNotice';
import { OpportunityNoticeFindOptions } from '../../models/opportunityNoticeFindOptions';
import { opportunityNoticeRepository } from '../../mongo/opportunityNoticeRepository';

export class GetOpportunityNoticeUseCase extends GetByUuidUseCase<
  OpportunityNotice,
  IEnrichedOpportunityNotice,
  OpportunityNoticeFindOptions
> {
  protected entityRepository: IOpportunityNoticeRepository = opportunityNoticeRepository;
  protected mapper = opportunityNoticeMapperDTO;

  protected getFindOptions(byIdCmd: ByUuidCommand): Result<OpportunityNoticeFindOptions> {
    return OpportunityNoticeFindOptions.create({
      criterias: {
        id: byIdCmd.id
      },
      expand: byIdCmd.expand
    });
  }

  protected getMapperOptions(options: OpportunityNoticeFindOptions): IOpportunityNoticeMapperOptions {
    return {
      ...super.getMapperOptions(options),
      expand: getAssetMapperExpandOptions(options?.expandOptions.map(expand => expand.field))
    };
  }
}

export const getOpportunityNoticeUseCase = new GetOpportunityNoticeUseCase();
