import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isNil } from 'lodash';

import { BaseRepository } from '../../../repositories/core/baseRepository';
import { Asset } from '../../asset/models/asset';
import { Audit } from '../../audit/audit';
import { IOpportunityNoticeRepository } from '../iOpportunityNoticeRepository';
import { OpportunityNoticeNote } from '../models/notes/opportunityNoticeNote';
import { IOpportunityNoticeProps, OpportunityNotice } from '../models/opportunityNotice';
import { IOpportunityNoticeCriterias, OpportunityNoticeFindOptions } from '../models/opportunityNoticeFindOptions';
import { OpportunityNoticeResponse } from '../models/opportunityNoticeResponse';
import { opportunityNoticeMatchBuilder } from '../opportunityNoticeMatchBuilder';
import {
  IOpportunityNoticeMongoAttributes,
  IOpportunityNoticeMongoDocument,
  OpportunityNoticeModel
} from './opportunityNoticeModel';
import { IOpportunityNoticeResponseAttributes } from './opportunityNoticeSchema';

class OpportunityNoticeRepository
  extends BaseRepository<OpportunityNotice, IOpportunityNoticeMongoDocument, OpportunityNoticeFindOptions>
  implements IOpportunityNoticeRepository {
  public get model(): OpportunityNoticeModel {
    return this.db.models.OpportunityNotice;
  }

  protected async getMatchFromQueryParams(criterias: IOpportunityNoticeCriterias): Promise<any> {
    return opportunityNoticeMatchBuilder.getMatchFromQueryParams(criterias);
  }

  protected getSortCorrespondance() {
    return [
      ...super.getSortCorrespondance(),
      { param: 'requestorId', dbName: 'requestorId', taxonomyGroup: TaxonomyGroup.requestor },
      { param: 'typeId', dbName: 'assets.typeId', taxonomyGroup: TaxonomyGroup.assetType, isArray: true },
      { param: 'status', dbName: 'status', taxonomyGroup: TaxonomyGroup.opportunityNoticeStatus }
    ];
  }

  protected async toDomainModel(raw: IOpportunityNoticeMongoAttributes): Promise<OpportunityNotice> {
    const notes: OpportunityNoticeNote[] = await OpportunityNoticeNote.toDomainModelBulk(raw.notes);
    const assets: Asset[] = await Asset.toDomainModelBulk(raw.assets);
    let response: OpportunityNoticeResponse;
    if (!isNil(raw.response)) {
      response = await OpportunityNoticeResponse.toDomainModel(raw.response);
    }

    const opportunityNoticeProps: IOpportunityNoticeProps = {
      projectId: raw.projectId,
      object: raw.object,
      contactInfo: raw.contactInfo,
      requestorId: raw.requestorId,
      followUpMethod: raw.followUpMethod,
      maxIterations: raw.maxIterations,
      status: raw.status,
      notes,
      assets,
      response,
      audit: await Audit.toDomainModel(raw.audit)
    };

    return OpportunityNotice.create(opportunityNoticeProps, raw._id).getValue();
  }

  protected toPersistence(opportunityNotice: OpportunityNotice): IOpportunityNoticeMongoAttributes {
    let response: IOpportunityNoticeResponseAttributes;
    if (!isNil(opportunityNotice.response)) {
      response = OpportunityNoticeResponse.toPersistance(opportunityNotice.response);
    }
    return {
      _id: opportunityNotice.id,
      assets: Asset.toPersistanceBulk(opportunityNotice.assets),
      contactInfo: opportunityNotice.contactInfo,
      followUpMethod: opportunityNotice.followUpMethod,
      maxIterations: opportunityNotice.maxIterations,
      object: opportunityNotice.object,
      projectId: opportunityNotice.projectId,
      requestorId: opportunityNotice.requestorId,
      status: opportunityNotice.status,
      response,
      notes: OpportunityNoticeNote.toPersistanceBulk(opportunityNotice.notes),
      audit: Audit.toPersistance(opportunityNotice.audit)
    };
  }
}
export const opportunityNoticeRepository = new OpportunityNoticeRepository();
