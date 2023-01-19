import { ErrorCodes, IApiError, ProgramBookStatus, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib';
import { cloneDeep, flatten, isEqual, isNil, remove, sortBy } from 'lodash';

import { assetService } from '../../../services/assetService';
import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { isEmpty } from '../../../utils/utils';
import { taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';
import { Objective } from '../models/objective';
import { IPlainObjectiveProps, PlainObjective } from '../models/plainObjective';
import { ProgramBook } from '../models/programBook';
import { UpdateProgramBookObjectiveCommand } from '../useCases/updateProgramBookObjective/updateProgramBookObjectiveCommand';

export const OBJECTIVES_ALLOWED_PROGRAM_BOOK_STATUSES = [
  ProgramBookStatus.new,
  ProgramBookStatus.programming,
  ProgramBookStatus.submittedPreliminary,
  ProgramBookStatus.submittedFinal
];
export class ObjectiveValidator {
  public static async validateAgainstOpenApi(plainObjective: IPlainObjectiveProps): Promise<Result<any>> {
    return openApiInputValidator.validateOpenApiModel('PlainObjective', plainObjective);
  }

  public static async validateAgainstTaxonomies(objective: IPlainObjectiveProps): Promise<Result<void>> {
    const errorDetails: IApiError[] = [];
    if (objective.requestorId) {
      await taxonomyValidator.validate(errorDetails, TaxonomyGroup.requestor, objective.requestorId);
    }
    if (objective.assetTypeIds) {
      await taxonomyValidator.validate(errorDetails, TaxonomyGroup.assetType, objective.assetTypeIds);
    }
    if (objective.workTypeIds) {
      await taxonomyValidator.validate(errorDetails, TaxonomyGroup.workType, objective.workTypeIds);
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

  public static async validateBusinessRulesForCreate(
    programBook: ProgramBook,
    objective: PlainObjective<IPlainObjectiveProps>
  ): Promise<Result<any>> {
    return Result.combine([
      await this.validateCommonBusinessRules(programBook, objective),
      this.validateObjectiveUnicity(programBook.objectives, objective)
    ]);
  }

  public static async validateBusinessRulesForUpdate(
    programBook: ProgramBook,
    input: UpdateProgramBookObjectiveCommand
  ): Promise<Result<any>> {
    return Result.combine([
      await this.validateCommonBusinessRules(programBook, input),
      this.validateObjectiveMatchingId(programBook.objectives, input)
    ]);
  }

  private static async validateCommonBusinessRules(
    programBook: ProgramBook,
    objective: PlainObjective<IPlainObjectiveProps>
  ): Promise<Result<any>> {
    return Result.combine([
      this.validateObjectiveReferenceValue(objective),
      this.validateObjectivePin(objective, programBook.objectives),
      await this.validateRelatedTypes(objective),
      this.canAddObjectiveToProgramBook(programBook)
    ]);
  }

  private static validateObjectiveReferenceValue(objective: PlainObjective<IPlainObjectiveProps>): Result<any> {
    if (objective && objective.referenceValue < 1) {
      return Result.fail(
        Guard.error(`Objective must contain positive reference value`, ErrorCodes.Taxonomy, `referenceValue`)
      );
    }
    return Result.ok();
  }

  private static validateObjectivePin(
    input: PlainObjective<IPlainObjectiveProps>,
    objectives: Objective[]
  ): Result<void> {
    const LIMIT_KEY_OBJECTIVE = 3;
    if (isEmpty(objectives) || !input.pin || objectives.length < LIMIT_KEY_OBJECTIVE) {
      return Result.ok();
    }
    const objective = objectives.find(obj => {
      return (
        obj.targetType === input.targetType &&
        obj.objectiveType === input.objectiveType &&
        obj.requestorId === (input.requestorId || null) &&
        isEqual(sortBy(obj.assetTypeIds), sortBy(input.assetTypeIds) || null) &&
        isEqual(sortBy(obj.workTypeIds), sortBy(input.workTypeIds) || null)
      );
    });
    if (
      objectives.filter(obj => obj.pin).length >= LIMIT_KEY_OBJECTIVE &&
      (isEmpty(objective) || (objective && !objective.pin))
    ) {
      return Result.fail(
        Guard.error(`A maximum of three key objectives are allowed`, ErrorCodes.ObjectivesKeyCount, `pin`)
      );
    }
    return Result.ok();
  }

  private static async validateRelatedTypes(objective: PlainObjective<IPlainObjectiveProps>): Promise<Result<void>> {
    if (!objective.assetTypeIds || !objective.workTypeIds) {
      return Result.ok();
    }
    const assetTypeTaxonomies = await assetService.getTaxonomyAssetTypes(objective.assetTypeIds);
    const validWorkTypes = flatten(assetTypeTaxonomies.map(x => x.properties.workTypes));
    const results: Result<any>[] = [Result.ok()];
    for (const workTypeId of objective.workTypeIds) {
      if (!validWorkTypes?.includes(workTypeId)) {
        results.push(
          Result.fail(
            Guard.error(
              `The work type: "${workTypeId}" is unsuitable for the selected asset types: "${objective.assetTypeIds}"`,
              ErrorCodes.Taxonomy,
              `workTypeIds/assetTypeIds`
            )
          )
        );
      }
    }
    return Result.combine(results);
  }

  private static canAddObjectiveToProgramBook(programBook: ProgramBook): Result<any> {
    if (!OBJECTIVES_ALLOWED_PROGRAM_BOOK_STATUSES.includes(programBook.status)) {
      return Result.fail(
        Guard.error(
          `Program book must contain one of these statuses : ${OBJECTIVES_ALLOWED_PROGRAM_BOOK_STATUSES.join(', ')}`,
          ErrorCodes.InvalidStatus,
          `referenceValue`
        )
      );
    }
    return Result.ok();
  }

  private static validateObjectiveUnicity(
    objectives: Objective[],
    objective: PlainObjective<IPlainObjectiveProps>
  ): Result<any> {
    if (this.isObjectiveAlreadyExists(objectives, objective)) {
      return Result.fail(Guard.error(`Program book objective already exist`, ErrorCodes.Duplicate, `objective`));
    }
    return Result.ok();
  }

  private static isObjectiveAlreadyExists(
    objectives: Objective[],
    plainObjective: PlainObjective<IPlainObjectiveProps>
  ): boolean {
    if (isEmpty(objectives) || isEmpty(plainObjective)) {
      return null;
    }
    const objective = objectives.find(obj => {
      return (
        obj.targetType === plainObjective.targetType &&
        obj.objectiveType === plainObjective.objectiveType &&
        obj.requestorId === (plainObjective.requestorId || null) &&
        isEqual(sortBy(obj.assetTypeIds), sortBy(plainObjective.assetTypeIds) || null) &&
        isEqual(sortBy(obj.workTypeIds), sortBy(plainObjective.workTypeIds) || null)
      );
    });

    return !isNil(objective);
  }

  private static validateObjectiveMatchingId(
    objectives: Objective[],
    objective: UpdateProgramBookObjectiveCommand
  ): Result<any> {
    const cloneObjectives = remove(cloneDeep(objectives), obj => obj.id !== objective.objectiveId);
    return this.validateObjectiveUnicity(cloneObjectives, objective);
  }
}
export const objectiveValidator = new ObjectiveValidator();
