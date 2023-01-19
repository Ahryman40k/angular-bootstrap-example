import { ErrorCodes, IApiError, IPlainNote, OpportunityNoticeStatus } from '@villemontreal/agir-work-planning-lib';

import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { Guard } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { openApiInputValidator } from '../../../../utils/openApiInputValidator';
import { isEmpty } from '../../../../utils/utils';
import { OpportunityNotice } from '../../models/opportunityNotice';

export class OpportunityNoticeNoteValidator {
  public static async validateAgainstOpenApi(plainOpportunityNoticeNote: IPlainNote): Promise<Result<any>> {
    const errorDetails: IApiError[] = [];
    await openApiInputValidator.validateInputModel(
      errorDetails,
      'PlainOpportunityNoticeNote',
      plainOpportunityNoticeNote
    );
    if (!isEmpty(errorDetails)) {
      return Result.combine(
        errorDetails.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCode, error.message));
        })
      );
    }
    return Result.ok();
  }

  public static validateCommonBusinessRules(projectNotice: OpportunityNotice): Result<any> {
    return this.validateProjectNoticeIsNotClosed(projectNotice);
  }

  private static validateProjectNoticeIsNotClosed(projectNotice: OpportunityNotice): Result<void> {
    if (projectNotice.status === OpportunityNoticeStatus.closed) {
      return Result.fail(
        Guard.error(
          'opportunityNotice.status',
          ErrorCodes.BusinessRule,
          'cant add or update note when opportunity notice is closed'
        )
      );
    }
    return Result.ok();
  }
}
