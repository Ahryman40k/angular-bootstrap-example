import { ErrorCodes, IApiError, ProjectCategory, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib';
import { isEqual, isNil, sortBy } from 'lodash';

import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { hasDuplicates } from '../../../utils/arrayUtils';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { isEmpty } from '../../../utils/utils';
import { ProgramBook } from '../../programBooks/models/programBook';
import { ServicePriority } from '../../servicePriority/models/servicePriority';
import { taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';
import { IPlainPriorityLevelProps, PlainPriorityLevel } from '../models/plainPriorityLevel';
import { IPriorityLevelProps } from '../models/priorityLevel';
import { ProjectCategoryCriteria } from '../models/projectCategoryCriteria';
import { ProgramBookPriorityScenarioValidator } from './priorityScenarioValidator';

export class PriorityLevelsValidator {
  public static async validateAgainstOpenApiBulk(priorityLevelInputs: IPriorityLevelProps[]): Promise<Result<any>> {
    if (isEmpty(priorityLevelInputs)) {
      return Result.fail(Guard.error('priorityLevels', ErrorCodes.MissingValue, 'Empty priorityLevelInputs'));
    }
    const results = await Promise.all(priorityLevelInputs.map(input => this.validateAgainstOpenApi(input)));
    return Result.combine(results);
  }

  public static async validateAgainstOpenApi(priorityLevelInput: IPriorityLevelProps): Promise<Result<any>> {
    return openApiInputValidator.validateOpenApiModel('PriorityLevel', priorityLevelInput);
  }

  public static async validateTaxonomy(priorityLevels: IPlainPriorityLevelProps[]): Promise<Result<void>> {
    const errorDetails: IApiError[] = [];
    if (!isEmpty(priorityLevels)) {
      for (const priorityLevel of priorityLevels) {
        await this.validateCriteriaTaxonomy(errorDetails, TaxonomyGroup.assetType, priorityLevel.criteria.assetTypeId);
        await this.validateProjectCategory(errorDetails, priorityLevel);
        await this.validateCriteriaTaxonomy(errorDetails, TaxonomyGroup.requestor, priorityLevel.criteria.requestorId);
        await this.validateCriteriaTaxonomy(errorDetails, TaxonomyGroup.workType, priorityLevel.criteria.workTypeId);
        await this.validateCriteriaTaxonomy(
          errorDetails,
          TaxonomyGroup.interventionType,
          priorityLevel.criteria.interventionType
        );
        await this.validateProjectServicePriorities(errorDetails, priorityLevel);
        await this.validateSortCriterias(errorDetails, priorityLevel);
      }
    }

    if (!isEmpty(errorDetails)) {
      return Result.combine(
        errorDetails.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCode, error.message));
        })
      );
    }
    return Result.ok();
  }

  public static async validateCriteriaTaxonomy<T extends string | string[]>(
    errorDetails: IApiError[],
    group: TaxonomyGroup,
    criteria: T
  ): Promise<void> {
    if (isEmpty(criteria)) {
      return;
    }
    await taxonomyValidator.validate(errorDetails, group, criteria);
  }

  private static async validateProjectCategory(
    errorDetails: IApiError[],
    priorityLevel: IPlainPriorityLevelProps
  ): Promise<void> {
    if (isEmpty(priorityLevel.criteria.projectCategory)) {
      return;
    }
    for (const projectCategory of priorityLevel.criteria.projectCategory) {
      await taxonomyValidator.validate(errorDetails, TaxonomyGroup.projectCategory, projectCategory.category);
      if (!isNil(projectCategory.subCategory)) {
        await taxonomyValidator.validate(errorDetails, TaxonomyGroup.projectSubCategory, projectCategory.subCategory);
      }
    }
  }
  private static async validateProjectServicePriorities(
    errorDetails: IApiError[],
    priorityLevel: IPlainPriorityLevelProps
  ): Promise<void> {
    if (isEmpty(priorityLevel.criteria.servicePriorities)) {
      return;
    }
    for (const servicePriority of priorityLevel.criteria.servicePriorities) {
      await taxonomyValidator.validate(errorDetails, TaxonomyGroup.service, servicePriority.service);
      await taxonomyValidator.validate(errorDetails, TaxonomyGroup.priorityType, servicePriority.priorityId);
    }
  }

  private static async validateSortCriterias(
    errorDetails: IApiError[],
    priorityLevel: IPlainPriorityLevelProps
  ): Promise<void> {
    if (isEmpty(priorityLevel.sortCriterias)) {
      return;
    }
    for (const sortCriterias of priorityLevel.sortCriterias) {
      if (isNil(sortCriterias.service)) {
        continue;
      }
      await taxonomyValidator.validate(errorDetails, TaxonomyGroup.service, sortCriterias.service);
    }
  }

  public static validateBusinessRules(
    programBook: ProgramBook,
    priorityLevels: PlainPriorityLevel<IPlainPriorityLevelProps>[]
  ): Result<any> {
    const sortedPriorityLevelsToValidate = sortBy(priorityLevels, i => i.rank);
    return Result.combine([
      ProgramBookPriorityScenarioValidator.validateProgramBookStatus(programBook),
      this.validateAutoIncrementalRanks(sortedPriorityLevelsToValidate),
      this.validateDefaultPriorityLevel(sortedPriorityLevelsToValidate),
      this.validateNotEmptyPriorityLevels(sortedPriorityLevelsToValidate),
      this.validateNotDuplicateCriterias(sortedPriorityLevelsToValidate),
      this.validateNotDuplicatePriorityLevels(sortedPriorityLevelsToValidate)
    ]);
  }

  private static validateAutoIncrementalRanks(
    priorityLevels: PlainPriorityLevel<IPlainPriorityLevelProps>[]
  ): Result<any> {
    let lastRank = 0;
    const results: Result<any>[] = [];
    for (const [index, priorityLevel] of priorityLevels.entries()) {
      if (priorityLevel.rank === lastRank + 1) {
        lastRank++;
      } else {
        results.push(
          Result.fail(
            Guard.error(
              `priorityLevels[${index}].rank`,
              ErrorCodes.SequenceBreak,
              `Program book priority scenario priority level missing the rank ${lastRank + 1}.`
            )
          )
        );
        break;
      }
    }
    if (!isEmpty(results)) {
      return Result.combine(results);
    }
    return Result.ok();
  }

  private static validateDefaultPriorityLevel(
    priorityLevels: PlainPriorityLevel<IPlainPriorityLevelProps>[]
  ): Result<any> {
    if (isEmpty(priorityLevels)) {
      return Result.fail(
        Guard.error(
          'priorityLevels',
          ErrorCodes.MissingValue,
          `Program book priority scenario default level is missing.`
        )
      );
    }
    const target = 'priorityLevels[0].criteria.projectCategory[0].category';
    const results: Result<any>[] = [];
    if (!isEqual(priorityLevels[0].criteria.projectCategory[0]?.category, ProjectCategory.completing)) {
      results.push(
        Result.fail(
          Guard.error(
            target,
            ErrorCodes.InvalidInput,
            `Priority scenario default priority level must have ${ProjectCategory.completing} as project category.`
          )
        )
      );
    }
    if (!isEmpty(priorityLevels[0].criteria.workTypeId)) {
      results.push(
        Result.fail(
          Guard.error(
            target,
            ErrorCodes.InvalidInput,
            `Priority scenario default priority level must have nothing as project workTypeId.`
          )
        )
      );
    }
    if (!isEmpty(priorityLevels[0].criteria.requestorId)) {
      results.push(
        Result.fail(
          Guard.error(
            target,
            ErrorCodes.InvalidInput,
            `Priority scenario default priority level must have nothing as project requestorId.`
          )
        )
      );
    }
    if (!isEmpty(priorityLevels[0].criteria.assetTypeId)) {
      results.push(
        Result.fail(
          Guard.error(
            target,
            ErrorCodes.InvalidInput,
            `Priority scenario default priority level must have nothing as project assetTypeId.`
          )
        )
      );
    }
    if (priorityLevels[0].rank !== 1) {
      results.push(
        Result.fail(
          Guard.error(
            'priorityLevels[0].rank',
            ErrorCodes.InvalidInput,
            `Program book priority scenario default level must have rank 1.`
          )
        )
      );
    }
    if (!isEmpty(results)) {
      return Result.combine(results);
    }
    return Result.ok();
  }

  private static validateNotDuplicateCriterias(
    priorityLevels: PlainPriorityLevel<IPlainPriorityLevelProps>[]
  ): Result<any> {
    const results: Result<any>[] = [];
    for (const priorityLevel of priorityLevels) {
      results.push(
        Result.combine([
          this.validateNotDuplicateCriteriaPropValue(priorityLevel.criteria.projectCategory, 'projectCategory'),
          this.validateNotDuplicateCriteriaPropValue(priorityLevel.criteria.servicePriorities, 'servicePriorities'),
          this.validateNotDuplicateCriteriaPropValue(priorityLevel.criteria.assetTypeId, 'assetTypeId'),
          this.validateNotDuplicateCriteriaPropValue(priorityLevel.criteria.requestorId, 'requestorId'),
          this.validateNotDuplicateCriteriaPropValue(priorityLevel.criteria.workTypeId, 'workTypeId'),
          this.validateNotDuplicateCriteriaPropValue(priorityLevel.criteria.interventionType, 'interventionType')
        ])
      );
    }
    if (!isEmpty(results)) {
      return Result.combine(results);
    }
    return Result.ok();
  }

  private static validateNotDuplicateCriteriaPropValue(
    propValues: string[] | ProjectCategoryCriteria[] | ServicePriority[],
    propName: string
  ): Result<any> {
    if (!propValues) {
      return Result.ok();
    }
    const results: Result<any>[] = [];
    for (const value of propValues) {
      if (
        hasDuplicates<string | ProjectCategoryCriteria | ServicePriority>(propValues, valueToCheck =>
          isEqual(valueToCheck, value)
        )
      ) {
        results.push(
          Result.fail(
            Guard.error(
              `priorityLevels.criteria.${propName}`,
              ErrorCodes.Duplicate,
              `Program book priority scenario priority level ${propName} are duplicated.`
            )
          )
        );
        break;
      }
    }
    if (!isEmpty(results)) {
      return Result.combine(results);
    }
    return Result.ok();
  }

  private static validateNotDuplicatePriorityLevels(
    priorityLevels: PlainPriorityLevel<IPlainPriorityLevelProps>[]
  ): Result<any> {
    const results: Result<any>[] = [];
    for (const priorityLevel of priorityLevels) {
      if (
        hasDuplicates(priorityLevels, priorityLevelToCheck =>
          priorityLevelToCheck.criteria.equals(priorityLevel.criteria)
        )
      ) {
        results.push(
          Result.fail(
            Guard.error(
              'priorityLevels.criteria',
              ErrorCodes.Duplicate,
              `Some program book priority scenario priority levels are duplicated`
            )
          )
        );
        break;
      }
    }
    if (!isEmpty(results)) {
      return Result.combine(results);
    }
    return Result.ok();
  }

  private static validateNotEmptyPriorityLevels(
    priorityLevels: PlainPriorityLevel<IPlainPriorityLevelProps>[]
  ): Result<any> {
    const results: Result<any>[] = [];
    if (
      priorityLevels.some(priorityLevel =>
        Object.values(priorityLevel.criteria.props).every(criteria => isEmpty(criteria))
      )
    ) {
      results.push(
        Result.fail(
          Guard.error(
            'priorityLevels.criteria',
            ErrorCodes.MissingValue,
            `A program book priority scenario priority level criteria is empty`
          )
        )
      );
    }
    if (!isEmpty(results)) {
      return Result.combine(results);
    }
    return Result.ok();
  }
}
