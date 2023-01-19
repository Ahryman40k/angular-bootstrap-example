import {
  ErrorCodes,
  IApiError,
  IEnrichedIntervention,
  IEnrichedProject,
  InterventionStatus,
  ITaxonomy,
  ProjectStatus,
  RequirementTargetType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { isEmpty, isNil, omit } from 'lodash';

import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Guard, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { ByInterventionIdCommand } from '../../interventions/useCases/byInterventionIdCommand';
import { interventionValidator } from '../../interventions/validators/interventionValidator';
import { ByProjectIdCommand } from '../../projects/useCases/byProjectIdCommand';
import { projectValidator } from '../../projects/validators/projectValidator';
import { taxonomyService } from '../../taxonomies/taxonomyService';
import { ITaxonomyValidation, taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';
import { IPlainRequirementProps } from '../models/plainRequirement';
import { Requirement } from '../models/requirement';

export class RequirementValidator {
  public static async validateAgainstOpenApi(requirementInput: IPlainRequirementProps): Promise<Result<any>> {
    return openApiInputValidator.validateOpenApiModel('PlainRequirement', omit(requirementInput, 'id'));
  }

  public static async validateTaxonomy(plainRequirement: IPlainRequirementProps): Promise<Result<any>> {
    const errorDetails: IApiError[] = [];
    const groups = [
      TaxonomyGroup.requirementType,
      TaxonomyGroup.requirementSubtype,
      TaxonomyGroup.requirementTargetType
    ];
    const taxonomies: ITaxonomy[] = await taxonomyService.getGroups(groups);

    const requirementTaxonomyProperties: ITaxonomyValidation[] = [
      { param: 'typeId', taxonomyGroup: TaxonomyGroup.requirementType, optionnal: false },
      { param: 'subtypeId', taxonomyGroup: TaxonomyGroup.requirementSubtype, optionnal: false }
    ];
    errorDetails.push(...taxonomyValidator.validateValues(plainRequirement, requirementTaxonomyProperties, taxonomies));

    if (!isEmpty(errorDetails)) {
      return Result.combine(
        errorDetails.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCode, error.message));
        })
      );
    }
    const taxonomySubTypeIds = taxonomies
      .map(taxo => {
        if (
          taxo.group === TaxonomyGroup.requirementSubtype &&
          taxo.properties?.requirementType === plainRequirement.typeId
        ) {
          return taxo.code;
        }
        return null;
      })
      .filter(x => x);
    if (isEmpty(taxonomySubTypeIds) || !taxonomySubTypeIds.includes(plainRequirement.subtypeId)) {
      return Result.fail(
        Guard.error(
          'typeId / SubtypeId',
          ErrorCodes.InvalidInput,
          `Subtype: ${plainRequirement.subtypeId} doesn't match typeId`
        )
      );
    }

    return Result.ok();
  }

  public static async validateCreateBusinessRules(requirement: Requirement): Promise<Result<IGuardResult>> {
    return Result.combine([await this.validateCommonBusinessRules(requirement)]);
  }

  public static async validateUpdateBusinessRules(requirement: Requirement): Promise<Result<IGuardResult>> {
    return Result.combine([await this.validateCommonBusinessRules(requirement)]);
  }

  public static async validateDeleteBusinessRules(requirement: Requirement): Promise<Result<IGuardResult>> {
    return Result.combine([await this.validateCommonBusinessRules(requirement)]);
  }

  private static async validateCommonBusinessRules(requirement: Requirement): Promise<Result<IGuardResult>> {
    return Result.combine([await this.validateEntitiesStatus(requirement)]);
  }

  private static async validateEntitiesStatus(requirement: Requirement): Promise<Result<IGuardResult>> {
    if (isNil(requirement.loadedEntities)) {
      await requirement.fetchItemsEntities();
    }
    return Result.combine([
      this.guardItemsEntityStatus(
        requirement.loadedEntities.filter(
          e =>
            ByInterventionIdCommand.guard({
              id: e.id
            }).succeeded
        ),
        [InterventionStatus.accepted, InterventionStatus.integrated]
      ),
      this.guardItemsEntityStatus(
        requirement.loadedEntities.filter(
          e =>
            ByProjectIdCommand.guard({
              id: e.id
            }).succeeded
        ),
        [
          ProjectStatus.planned,
          ProjectStatus.programmed,
          ProjectStatus.postponed,
          ProjectStatus.replanned,
          ProjectStatus.preliminaryOrdered,
          ProjectStatus.finalOrdered
        ]
      )
    ]);
  }

  // validate if user have restrictions on requirement Items (project and intervention)
  public static async validateItemsRestrictions(requirement: Requirement): Promise<Result<IGuardResult>> {
    const items = requirement.items || [];
    const interventionsIds = items.filter(el => el.type === RequirementTargetType.intervention).map(el => el.id);
    const projectIds = items.filter(el => el.type === RequirementTargetType.project).map(el => el.id);
    const interventions: IEnrichedIntervention[] = await requirement.fetchItemEntity<IEnrichedIntervention>(
      interventionsIds,
      RequirementTargetType.intervention,
      ['boroughId', 'executorId', 'requestorId'] as (keyof IEnrichedIntervention)[]
    );
    const projects: IEnrichedProject[] = await requirement.fetchItemEntity<IEnrichedProject>(
      projectIds,
      RequirementTargetType.project,
      ['boroughId', 'executorId'] as (keyof IEnrichedProject)[]
    );
    const projectsResult = Result.combine(projects.map(el => projectValidator.validateRestrictions(el)));
    const interventionsResult = Result.combine(interventions.map(el => interventionValidator.validateRestrictions(el)));
    return Result.combine([projectsResult, interventionsResult]);
  }

  private static guardItemsEntityStatus(
    entities: (IEnrichedIntervention | IEnrichedProject)[],
    statuses: string[]
  ): Result<IGuardResult> {
    const guard = Guard.combine(
      entities
        .filter(entity => !statuses.includes(entity.status))
        .map(entity =>
          Guard.errorForbidden({
            argument: entity.status,
            argumentName: `Item ${entity.id} has a wrong status ${entity.status}`
          })
        )
    );

    if (!guard.succeeded) {
      return Result.fail<IGuardResult>(guard);
    }
    return Result.ok<IGuardResult>();
  }

  public static async validateItemsExists(requirement: Requirement): Promise<Result<IGuardResult | void>> {
    const itemEntities = await requirement.fetchItemsEntities();

    const guards: IGuardResult[] = [];
    for (const item of requirement.items) {
      if (!itemEntities.find(e => e.id === item.id)) {
        guards.push(
          Guard.errorNotFound({
            argument: item.id,
            argumentName: `The ${item.type} ${item.id} was not found`
          })
        );
      }
    }

    const combinedGuard = Guard.combine(guards);
    if (!combinedGuard.succeeded) {
      return Result.fail(guards);
    }

    return Result.ok();
  }
}
