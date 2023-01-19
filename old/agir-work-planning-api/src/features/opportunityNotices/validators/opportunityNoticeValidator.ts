import {
  ErrorCodes,
  IAsset,
  IEnrichedProject,
  IPlainOpportunityNotice,
  IPlainProject,
  ITaxonomy,
  OpportunityNoticeResponseRequestorDecision,
  OpportunityNoticeStatus,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { IApiError } from '@villemontreal/core-utils-general-nodejs-lib/dist/src';
import { isEmpty } from 'lodash';

import { Guard, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import {
  OPPORTUNITY_NOTICE_RESTRICTION_TYPES,
  RestrictionsValidator
} from '../../../shared/restrictions/restrictionsValidator';
import { IRestriction } from '../../../shared/restrictions/userRestriction';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { appUtils } from '../../../utils/utils';
import { Asset } from '../../asset/models/asset';
import { taxonomyService } from '../../taxonomies/taxonomyService';
import { ITaxonomyValidation, taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';
import { OpportunityNotice } from '../models/opportunityNotice';
import { OpportunityNoticeResponse } from '../models/opportunityNoticeResponse';
import { IPlainOpportunityNoticeProps, PlainOpportunityNotice } from '../models/plainOpportunityNotice';
import {
  IPlainOpportunityNoticeResponseProps,
  PlainOpportunityNoticeResponse
} from '../models/plainOpportunityNoticeResponse';

export class OpportunityNoticeValidator {
  public static async validateAgainstOpenApi(plainOpportunityNotice: IPlainOpportunityNotice): Promise<Result<any>> {
    return openApiInputValidator.validateOpenApiModel('PlainOpportunityNotice', plainOpportunityNotice);
  }

  public static async validateTaxonomy(plainOpportunityNotice: IPlainOpportunityNotice): Promise<Result<any>> {
    const errorDetails: IApiError[] = [];
    const taxonomies: ITaxonomy[] = await taxonomyService.getGroup(TaxonomyGroup.opportunityNoticeFollowUpMethod);

    const opportunityNoticeTaxonomyProperties: ITaxonomyValidation[] = [
      { param: 'followUpMethod', taxonomyGroup: TaxonomyGroup.opportunityNoticeFollowUpMethod, optionnal: false }
    ];
    errorDetails.push(
      ...taxonomyValidator.validateValues(plainOpportunityNotice, opportunityNoticeTaxonomyProperties, taxonomies)
    );

    if (!isEmpty(errorDetails)) {
      return Result.combine(
        errorDetails.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCodes, error.message));
        })
      );
    }

    return Result.ok();
  }

  public static validateCreateBusinessRules(
    project: IEnrichedProject,
    projectOpportunityNotices: OpportunityNotice[],
    assets: IAsset[]
  ): Result<any> {
    const commonBusinessRulesResult = OpportunityNoticeValidator.validateCommonBusinessRules(project);
    const createBusinessRulesResult = OpportunityNoticeValidator.validateAssetProjectNoticesAreClosed(
      projectOpportunityNotices,
      assets
    );
    return Result.combine([commonBusinessRulesResult, createBusinessRulesResult]);
  }

  public static validateUpdateBusinessRules(
    currentOpportunityNotice: OpportunityNotice,
    incomingOpportunityNotice: PlainOpportunityNotice<IPlainOpportunityNoticeProps>,
    currentProject: IEnrichedProject
  ): Result<any> {
    const commonBusinessRulesResult = OpportunityNoticeValidator.validateCommonBusinessRules(currentProject);
    const updateBusinessRulesStatusResult = OpportunityNoticeValidator.validateOpportunityNoticeStatus(
      currentOpportunityNotice
    );
    const projectIdBusinessRulesStatusResult = OpportunityNoticeValidator.validateOpportunityNoticeProjectId(
      currentOpportunityNotice,
      currentProject
    );
    const updateBusinessRulesAssetsResult = OpportunityNoticeValidator.validateOpportunityNoticeAssets(
      currentOpportunityNotice.assets,
      incomingOpportunityNotice.assets
    );
    const responseBusinessRulesResult = OpportunityNoticeValidator.validateOpportunityNoticeResponse(
      currentOpportunityNotice.response,
      incomingOpportunityNotice.response
    );
    return Result.combine([
      commonBusinessRulesResult,
      updateBusinessRulesStatusResult,
      projectIdBusinessRulesStatusResult,
      updateBusinessRulesAssetsResult,
      responseBusinessRulesResult
    ]);
  }
  private static validateCommonBusinessRules(project: IEnrichedProject): Result<any> {
    return Result.combine([this.validateProjectStartYear(project), this.validateProjectIsIntegratedTypePI(project)]);
  }

  private static validateAssetProjectNoticesAreClosed(
    projectNotices: OpportunityNotice[],
    assets?: IAsset[]
  ): Result<void> {
    if (!assets) {
      return Result.ok();
    }
    const assetIds = assets.map(asset => asset.id);
    if (
      projectNotices.some(
        projectNotice =>
          projectNotice.assets.some(asset => assetIds.includes(asset.id)) &&
          projectNotice.status !== OpportunityNoticeStatus.closed
      )
    ) {
      return Result.fail(
        Guard.error(
          'project.opportunityNotices.status / project.opportunityNotices.assets[].id',
          ErrorCodes.OpportunityNoticeAsset,
          `We can create only an opportunity notice by asset unless the other notices have ${OpportunityNoticeStatus.closed} status for the assets`
        )
      );
    }
    return Result.ok();
  }

  private static validateProjectStartYear(project: IEnrichedProject): Result<void> {
    const currentYear = appUtils.getCurrentYear();
    if (project.startYear < currentYear) {
      return Result.fail(
        Guard.error(
          'project.startYear',
          ErrorCodes.OpportunityNoticeProjectStartYear,
          'Opportunity notice must be created before or the same year as the project start year'
        )
      );
    }
    return Result.ok();
  }

  private static validateProjectIsIntegratedTypePI(project: IEnrichedProject): Result<void> {
    if (project.projectTypeId !== ProjectType.integrated && project.projectTypeId !== ProjectType.integratedgp) {
      return Result.fail(
        Guard.error(
          'project.projectTypeId',
          ErrorCodes.OpportunityNoticeProjectType,
          `Project must be of type: ${ProjectType.integrated} to create an opportunity notice`
        )
      );
    }
    return Result.ok();
  }

  private static validateOpportunityNoticeStatus(opportunityNotice: OpportunityNotice): Result<any> {
    if (opportunityNotice.status === OpportunityNoticeStatus.closed) {
      return Result.fail(
        Guard.error(
          'opportunityNotice.status',
          ErrorCodes.InvalidStatus,
          `Opportunity notice must have different status than ${OpportunityNoticeStatus.closed}`
        )
      );
    }
    return Result.ok();
  }

  private static validateOpportunityNoticeAssets(currentAssets: Asset[], incomingAssets: Asset[]): Result<any> {
    const equals =
      currentAssets.length === incomingAssets.length &&
      currentAssets.every((asset, i) => asset.equals(incomingAssets[i]));
    if (!equals) {
      return Result.fail(Guard.error('opportunityNotice.assets', ErrorCodes.InvalidInput, `assets list was changed`));
    }
    return Result.ok();
  }

  private static validateOpportunityNoticeProjectId(
    currentOpportunityNotice: OpportunityNotice,
    currentProject: IEnrichedProject
  ): Result<any> {
    if (currentOpportunityNotice.projectId !== currentProject.id) {
      return Result.fail(
        Guard.error(
          'opportunityNotice.projectId',
          ErrorCodes.OpportunityNoticeProjectId,
          `It is impossible to transfer opportunity notice to another project`
        )
      );
    }
    return Result.ok();
  }

  private static validateOpportunityNoticeResponse(
    currentOpportunityNoticeResponse: OpportunityNoticeResponse,
    incomingOpportunityNoticeResponse: PlainOpportunityNoticeResponse<IPlainOpportunityNoticeResponseProps>
  ): Result<any> {
    return Result.combine([
      this.validateResponseNoWithDecisionNote(incomingOpportunityNoticeResponse),
      this.validateResponseDefinitiveIsFinal(currentOpportunityNoticeResponse, incomingOpportunityNoticeResponse)
    ]);
  }

  private static validateResponseNoWithDecisionNote(
    incomingOpportunityNoticeResponse: PlainOpportunityNoticeResponse<IPlainOpportunityNoticeResponseProps>
  ): Result<any> {
    if (!incomingOpportunityNoticeResponse) {
      return Result.ok();
    }
    if (
      incomingOpportunityNoticeResponse.requestorDecision === OpportunityNoticeResponseRequestorDecision.no &&
      incomingOpportunityNoticeResponse.planningDecisionNote
    ) {
      return Result.fail(
        Guard.error(
          'opportunityNotice.response',
          ErrorCodes.OpportunityNoticeResponseDecisionNote,
          `cant update notice when response is no and a decision note is present`
        )
      );
    }
    return Result.ok();
  }

  private static validateResponseDefinitiveIsFinal(
    currentOpportunityNoticeResponse: OpportunityNoticeResponse,
    incomingOpportunityNoticeResponse: PlainOpportunityNoticeResponse<IPlainOpportunityNoticeResponseProps>
  ): Result<any> {
    if (!currentOpportunityNoticeResponse || (currentOpportunityNoticeResponse && !incomingOpportunityNoticeResponse)) {
      return Result.ok();
    }
    const DEFINITIVE_RESPONSES = [
      OpportunityNoticeResponseRequestorDecision.no,
      OpportunityNoticeResponseRequestorDecision.yes
    ];
    if (
      DEFINITIVE_RESPONSES.includes(
        currentOpportunityNoticeResponse.requestorDecision as OpportunityNoticeResponseRequestorDecision
      ) &&
      incomingOpportunityNoticeResponse.requestorDecision !== currentOpportunityNoticeResponse.requestorDecision
    ) {
      return Result.fail(
        Guard.error(
          'opportunityNotice.response',
          ErrorCodes.OpportunityNoticeResponseRequestorDecision,
          `cant update notice when response is definitive and the requestor decision is different`
        )
      );
    }
    return Result.ok();
  }
  // get requestorId from opportunityNotice
  // get boroughId and executorId from project
  public static validateRestrictions(
    opportunityNotice: PlainOpportunityNotice<IPlainOpportunityNoticeProps>,
    project: IEnrichedProject | IPlainProject
  ): Result<IGuardResult> {
    const restrictions: IRestriction = {
      BOROUGH: [project.boroughId],
      REQUESTOR: [opportunityNotice.requestorId],
      EXECUTOR: [project.executorId]
    };
    return RestrictionsValidator.validate(OPPORTUNITY_NOTICE_RESTRICTION_TYPES, restrictions);
  }
}
