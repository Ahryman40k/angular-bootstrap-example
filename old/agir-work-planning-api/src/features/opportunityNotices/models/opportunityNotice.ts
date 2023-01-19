import {
  OpportunityNoticeResponseRequestorDecision,
  OpportunityNoticeStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';

import { configs } from '../../../../config/configs';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { appUtils } from '../../../utils/utils';
import { Asset } from '../../asset/models/asset';
import { Audit } from '../../audit/audit';
import { Auditable, IAuditableProps } from '../../audit/auditable';
import { OpportunityNoticeNote } from './notes/opportunityNoticeNote';
import { OpportunityNoticeResponse } from './opportunityNoticeResponse';
import { IPlainOpportunityNoticeProps, PlainOpportunityNotice } from './plainOpportunityNotice';

// tslint:disable:no-empty-interface
export interface IOpportunityNoticeProps extends IPlainOpportunityNoticeProps, IAuditableProps {
  status: string;
  notes?: OpportunityNoticeNote[];
  response?: OpportunityNoticeResponse;
  assets: Asset[];
}

export class OpportunityNotice extends Auditable(PlainOpportunityNotice)<IOpportunityNoticeProps> {
  public static create(props: IOpportunityNoticeProps, id?: string): Result<OpportunityNotice> {
    const guardPlain = PlainOpportunityNotice.guard(props);
    const guardAudit = Audit.guard(props.audit);
    let guardAsset = { succeeded: true };
    if (!isEmpty(props.assets)) {
      guardAsset = Guard.combine(props.assets.map(asset => Asset.guard(asset)));
    }
    const guardResult = Guard.combine([guardPlain, guardAudit, guardAsset]);
    if (!guardResult.succeeded) {
      return Result.fail<OpportunityNotice>(guardResult);
    }
    const opportunity = new OpportunityNotice(props, id);
    return Result.ok<OpportunityNotice>(opportunity);
  }

  public get response(): OpportunityNoticeResponse {
    return this.props.response;
  }

  public get status(): string {
    let currentStatus = this.props.status;
    // an opportunity notice is inProgress after n days
    if (
      currentStatus === OpportunityNoticeStatus.new &&
      appUtils.daysBetweenDates(new Date(), new Date(this.audit.createdAt)) >=
        configs.rules.opportunityNotice.outdatedInDays
    ) {
      currentStatus = OpportunityNoticeStatus.inProgress;
    }
    return currentStatus;
  }

  public get notes(): OpportunityNoticeNote[] {
    return this.props.notes ? this.props.notes : [];
  }

  public static getStatusFromResponse(response: OpportunityNoticeResponse): OpportunityNoticeStatus {
    switch (response?.requestorDecision) {
      case OpportunityNoticeResponseRequestorDecision.yes:
      case OpportunityNoticeResponseRequestorDecision.no:
        return OpportunityNoticeStatus.closed;
      case OpportunityNoticeResponseRequestorDecision.analyzing:
        return OpportunityNoticeStatus.inProgress;
      default:
        return OpportunityNoticeStatus.new;
    }
  }
}
