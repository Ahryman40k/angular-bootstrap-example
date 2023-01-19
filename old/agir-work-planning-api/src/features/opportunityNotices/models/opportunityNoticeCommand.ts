import { IGuardResult } from '../../../shared/logic/guard';
import { IPlainOpportunityNoticeProps, PlainOpportunityNotice } from './plainOpportunityNotice';

// tslint:disable:no-empty-interface
export interface IOpportunityNoticeCommandProps extends IPlainOpportunityNoticeProps {}

export abstract class OpportunityNoticeCommand<P extends IOpportunityNoticeCommandProps> extends PlainOpportunityNotice<
  P
> {
  public static guard(props: IOpportunityNoticeCommandProps): IGuardResult {
    return PlainOpportunityNotice.guard(props);
  }
}
