import {
  IAsset,
  IAudit,
  IEnrichedNote,
  IEnrichedOpportunityNotice,
  IEnrichedOpportunityNoticeResponse
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { assetMapperDTO, IAssetMapperOptions } from '../../asset/mappers/assetMapperDTO';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { OpportunityNotice } from '../models/opportunityNotice';
import { opportunityNoticeNoteMapperDTO } from './notes/opportunityNoticeNoteMapperDTO';
import { opportunityNoticeResponseMapperDTO } from './opportunityNoticeResponseMapperDTO';

// tslint:disable:no-empty-interface
export interface IOpportunityNoticeMapperOptions extends IAssetMapperOptions {}

class OpportunityNoticeMapperDTO extends FromModelToDtoMappings<
  OpportunityNotice,
  IEnrichedOpportunityNotice,
  IOpportunityNoticeMapperOptions
> {
  protected async getFromNotNullModel(
    opportunityNotice: OpportunityNotice,
    options: IOpportunityNoticeMapperOptions
  ): Promise<IEnrichedOpportunityNotice> {
    const [notesDTO, responseDTO, auditDTO, assetsDTO] = await Promise.all([
      opportunityNoticeNoteMapperDTO.getFromModels(opportunityNotice.notes),
      opportunityNoticeResponseMapperDTO.getFromModel(opportunityNotice.response),
      auditMapperDTO.getFromModel(opportunityNotice.audit),
      assetMapperDTO.getFromModels(opportunityNotice.assets, options)
    ]);
    return this.map(opportunityNotice, notesDTO, responseDTO, auditDTO, assetsDTO);
  }

  // For now it is a one/one but could be different
  private map(
    opportunityNotice: OpportunityNotice,
    notesDTO: IEnrichedNote[],
    responseDTO: IEnrichedOpportunityNoticeResponse,
    auditDTO: IAudit,
    assetsDTO: IAsset[]
  ): IEnrichedOpportunityNotice {
    return {
      id: opportunityNotice.id.toString(),
      projectId: opportunityNotice.projectId,
      object: opportunityNotice.object,
      assets: assetsDTO,
      requestorId: opportunityNotice.requestorId,
      contactInfo: opportunityNotice.contactInfo,
      followUpMethod: opportunityNotice.followUpMethod,
      maxIterations: opportunityNotice.maxIterations,
      notes: notesDTO,
      response: responseDTO,
      status: opportunityNotice.status,
      audit: auditDTO
    };
  }
}

export const opportunityNoticeMapperDTO = new OpportunityNoticeMapperDTO();
