import { ErrorCodes, IApiError, Permission, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { get, isEmpty, isNil } from 'lodash';

import { userService } from '../../../services/userService';
import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Guard, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { convertStringOrStringArray } from '../../../utils/arrayUtils';
import { taxonomyService } from '../../taxonomies/taxonomyService';
import { RtuImportError } from '../models/rtuImportError';
import { RtuProject } from '../models/rtuProject';
import { IRtuProjectCriterias } from '../models/rtuProjectFindOptions';

export class RtuProjectValidator {
  public static noPermissionForPartnerGuardResult = Result.fail<IGuardResult>(
    Guard.error('partnerId', ErrorCodes.BusinessRule, 'You are not allowed to view rtu projects with partner category')
  );

  public static async validateTaxonomies(rtuProject: RtuProject): Promise<Result<any>> {
    const errorDetails: IApiError[] = [];
    const inforRtuParnerCodes = await taxonomyService.getGroup(TaxonomyGroup.infoRtuPartner);
    const rtuProjectStatusCodes = await taxonomyService.getGroup(TaxonomyGroup.rtuProjectStatus);

    const constraintTaxonomyProperties: {
      param: string;
      taxonomyGroup: string;
      optionnal: boolean;
      values: string[];
    }[] = [
      {
        param: 'partnerId',
        taxonomyGroup: TaxonomyGroup.infoRtuPartner,
        optionnal: false,
        values: inforRtuParnerCodes.map(item => item.code)
      },
      {
        param: 'status',
        taxonomyGroup: TaxonomyGroup.rtuProjectStatus,
        optionnal: false,
        values: rtuProjectStatusCodes.map(item => item.code)
      }
    ];

    for (const property of constraintTaxonomyProperties) {
      const objectPropertyValue = get(rtuProject, property.param);
      if (!property.optionnal || objectPropertyValue) {
        const foundInValues = property.values.includes(objectPropertyValue);
        if (!foundInValues && !isNil(objectPropertyValue)) {
          errorDetails.push({
            code: ErrorCodes.Taxonomy,
            message: `${objectPropertyValue}`,
            target: property.param
          });
        }
      }
    }
    if (!isEmpty(errorDetails)) {
      return Result.combine(
        errorDetails.map(error => {
          return Result.fail(
            RtuImportError.create({
              code: error.code as ErrorCode,
              target: error.target,
              values: { value1: error.message }
            }).getValue()
          );
        })
      );
    }
    return Result.ok();
  }

  public static async validateUserPermissionFromRtuProject(rtuProject: RtuProject): Promise<Result<any>> {
    const user = userService.currentUser;
    const taxonomies = await taxonomyService.getGroupAndProperty(TaxonomyGroup.infoRtuPartner, 'category', 'partner');

    if (
      taxonomies.map(taxo => taxo.code).includes(rtuProject.partnerId) &&
      !user.hasPermission(Permission.PARTNER_PROJECT_READ)
    ) {
      return this.noPermissionForPartnerGuardResult;
    }
    return Result.ok();
  }

  public static async validateUserPermissionFromCriterias(
    criterias: IRtuProjectCriterias
  ): Promise<Result<IGuardResult>> {
    const isUserHasProjectPartnerReadPermission = userService.currentUser.hasPermission(
      Permission.PARTNER_PROJECT_READ
    );
    const isCriteriaHavingPartnerId = !!criterias.partnerId;
    if (!isCriteriaHavingPartnerId && !isUserHasProjectPartnerReadPermission) {
      return RtuProjectValidator.noPermissionForPartnerGuardResult;
    }

    const partnerIds: string[] = convertStringOrStringArray(criterias.partnerId);

    const partnerTaxonomies = await taxonomyService.getGroupAndProperty(
      TaxonomyGroup.infoRtuPartner,
      'category',
      'partner'
    );
    if (
      !isUserHasProjectPartnerReadPermission &&
      partnerIds.some(partnerId => partnerTaxonomies.map(taxo => taxo.code).includes(partnerId))
    ) {
      return RtuProjectValidator.noPermissionForPartnerGuardResult;
    }
    return Result.ok();
  }
}
