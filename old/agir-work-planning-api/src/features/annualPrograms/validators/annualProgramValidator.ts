import {
  AnnualProgramConstant,
  AnnualProgramStatus,
  ErrorCodes,
  IApiError,
  IEnrichedProject,
  ITaxonomy,
  IUuid,
  ProgramBookStatus,
  Role,
  ShareableRole,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { get, isArray, isEmpty } from 'lodash';

import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Guard, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import {
  ANNUAL_PROGRAM_RESTRICTION_TYPES,
  RestrictionsValidator
} from '../../../shared/restrictions/restrictionsValidator';
import { IRestriction } from '../../../shared/restrictions/userRestriction';
import { convertStringOrStringArray } from '../../../utils/arrayUtils';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { commonValidator, ITaxonomyValidatorProperty } from '../../../validators/commonValidator';
import { db } from '../../database/DB';
import { ProgramBook } from '../../programBooks/models/programBook';
import { ProgramBookFindOptions } from '../../programBooks/models/programBookFindOptions';
import { programBookRepository } from '../../programBooks/mongo/programBookRepository';
import { ProjectFindOptions } from '../../projects/models/projectFindOptions';
import { projectRepository } from '../../projects/mongo/projectRepository';
import { taxonomyService } from '../../taxonomies/taxonomyService';
import { taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';
import { AnnualProgram } from '../models/annualProgram';
import { AnnualProgramFindOptions, IAnnualProgramCriterias } from '../models/annualProgramFindOptions';
import { IPlainAnnualProgramProps, PlainAnnualProgram } from '../models/plainAnnualProgram';
import { AnnualProgramModel } from '../mongo/annualProgramModel';
import { annualProgramRepository } from '../mongo/annualProgramRepository';

export class AnnualProgramValidator {
  public static async validateCommonBusinessRules(
    inputAnnualProgram: PlainAnnualProgram<IPlainAnnualProgramProps>,
    annualProgramId?: IUuid
  ): Promise<Result<any>> {
    return Result.combine([
      this.validateTargetYear(inputAnnualProgram),
      await this.validateUnique(inputAnnualProgram, annualProgramId),
      await this.validateSharedRole(inputAnnualProgram, annualProgramId)
    ]);
  }

  public static async validateAgainstOpenApi(annualProgramInput: IPlainAnnualProgramProps): Promise<Result<any>> {
    return openApiInputValidator.validateOpenApiModel('PlainAnnualProgram', annualProgramInput);
  }

  public static async validateAgainstTaxonomies(
    annualProgram: IPlainAnnualProgramProps | IAnnualProgramCriterias
  ): Promise<Result<any>> {
    const errorDetails: IApiError[] = [];
    const groups = [TaxonomyGroup.annualProgramStatus, TaxonomyGroup.executor, TaxonomyGroup.role];
    const taxonomies: ITaxonomy[] = await taxonomyService.getGroups(groups);
    const annualProgramTaxonomyProperties: ITaxonomyValidatorProperty[] = [
      { param: 'executorId', taxonomyGroup: TaxonomyGroup.executor, optionnal: false },
      { param: 'status', taxonomyGroup: TaxonomyGroup.annualProgramStatus, optionnal: true },
      { param: 'sharedRoles', taxonomyGroup: TaxonomyGroup.role, optionnal: true }
    ];
    for (const property of annualProgramTaxonomyProperties) {
      let objectPropertyValue = get(annualProgram, property.param);
      if (!property.optionnal || objectPropertyValue) {
        objectPropertyValue = convertStringOrStringArray(objectPropertyValue);
        if (isArray(objectPropertyValue)) {
          for (const item of objectPropertyValue) {
            commonValidator.validateTaxonomies(errorDetails, taxonomies, property, item);
          }
        } else {
          commonValidator.validateTaxonomies(errorDetails, taxonomies, property, objectPropertyValue);
        }
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

  public static async validateUpdateBusinessRules(
    inputAnnualProgram: PlainAnnualProgram<IPlainAnnualProgramProps>,
    currentAnnualProgram: AnnualProgram
  ): Promise<Result<any>> {
    return Result.combine([
      await this.validateCommonBusinessRules(inputAnnualProgram, currentAnnualProgram.id),
      await this.validateTaxonomyStatus(inputAnnualProgram),
      await this.validateUpdateStatus(inputAnnualProgram, currentAnnualProgram),
      await this.canModifyYearAndExecutor(currentAnnualProgram, inputAnnualProgram)
    ]);
  }

  public static validateDeleteBusinessRules(annualProgram: AnnualProgram): Result<void> {
    if (!isEmpty(annualProgram.programBooks)) {
      return Result.fail(
        Guard.error(
          'programBooks',
          ErrorCodes.InvalidStatus,
          `Cannot delete annual program if it contains a program book`
        )
      );
    }
    return Result.ok();
  }

  private static validateTargetYear(annualProgram: PlainAnnualProgram<IPlainAnnualProgramProps>): Result<any> {
    if (AnnualProgramConstant.minimumYear > annualProgram.year) {
      return Result.fail(
        Guard.error(
          'year',
          ErrorCodes.AnnualProgramTargetYear,
          `Year must be greater or equal than year : ${AnnualProgramConstant.minimumYear}`
        )
      );
    }
    return Result.ok();
  }

  private static async validateSharedRole(
    annualProgram: PlainAnnualProgram<IPlainAnnualProgramProps>,
    annualProgramId: IUuid
  ): Promise<Result<any>> {
    if (isEmpty(annualProgram.sharedRoles)) {
      return Result.ok();
    }
    return Result.combine([
      this.validateCanShareRoles(annualProgram, annualProgramId),
      await this.validateSharedTaxonomies(annualProgram)
    ]);
  }

  private static validateCanShareRoles(
    annualProgram: PlainAnnualProgram<IPlainAnnualProgramProps>,
    annualProgramId: IUuid
  ): Result<any> {
    if (isEmpty(annualProgramId) && !isEmpty(annualProgram.sharedRoles)) {
      return Result.fail(
        Guard.error(
          'sharedRole',
          ErrorCodes.AnnualProgramSharedRole,
          `Annual program can not be created with shared role`
        )
      );
    }
    return Result.ok();
  }

  private static async validateSharedTaxonomies(
    annualProgram: PlainAnnualProgram<IPlainAnnualProgramProps>
  ): Promise<Result<any>> {
    const taxonomies: ITaxonomy[] = await taxonomyService.getGroup(TaxonomyGroup.shareableRole);
    const taxonomy: ITaxonomy = taxonomies.find(taxo => taxo.code === ShareableRole.annualProgram);
    const resultErrors: Result<void>[] = [];
    for (const role of annualProgram.sharedRoles) {
      if (!taxonomy.valueString1.includes(role)) {
        resultErrors.push(
          Result.fail(
            Guard.error(
              'sharedRole',
              ErrorCodes.AnnualProgramSharedRole,
              `That annual program can not be shared with role : ${role}`
            )
          )
        );
      }
    }
    if (!isEmpty(resultErrors)) {
      return Result.combine(resultErrors);
    }
    return Result.ok();
  }

  private static async validateUnique(
    input: PlainAnnualProgram<IPlainAnnualProgramProps>,
    annualProgramId?: string
  ): Promise<Result<any>> {
    const annualProgramFindOptionsResult = AnnualProgramFindOptions.create({
      criterias: {
        year: input.year,
        executorId: input.executorId
      }
    });
    if (annualProgramFindOptionsResult.isFailure) {
      return annualProgramFindOptionsResult;
    }
    let annualPrograms: AnnualProgram[] = await annualProgramRepository.findAll(
      annualProgramFindOptionsResult.getValue()
    );
    if (annualProgramId) {
      annualPrograms = annualPrograms.filter(ap => ap.id !== annualProgramId);
    }

    if (!isEmpty(annualPrograms)) {
      return Result.fail(Guard.error('year, executorId', ErrorCodes.Duplicate, 'This annual program already exist'));
    }
    return Result.ok();
  }

  public static async validateTaxonomyStatus(
    annualProgram: PlainAnnualProgram<IPlainAnnualProgramProps>
  ): Promise<Result<any>> {
    const errorDetails: IApiError[] = [];
    await taxonomyValidator.validate(errorDetails, TaxonomyGroup.annualProgramStatus, annualProgram.status);
    // TODO Direclty return result from taxonomy validator
    if (!isEmpty(errorDetails)) {
      return Result.combine(
        errorDetails.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCode, error.message));
        })
      );
    }
    return Result.ok();
  }

  private static async canModifyYearAndExecutor(
    annualProgram: AnnualProgram,
    inputPlainAnnualProgram: PlainAnnualProgram<IPlainAnnualProgramProps>
  ): Promise<Result<any>> {
    if (
      inputPlainAnnualProgram.executorId === annualProgram.executorId &&
      inputPlainAnnualProgram.year === annualProgram.year
    ) {
      return Result.ok();
    }
    const programBookFindOptionsResult = ProgramBookFindOptions.create({
      criterias: { annualProgramId: annualProgram.id }
    });
    if (programBookFindOptionsResult.isFailure) {
      return programBookFindOptionsResult;
    }
    const programBooks: ProgramBook[] = await programBookRepository.findAll(programBookFindOptionsResult.getValue());

    const projectFindOptionsResult = ProjectFindOptions.create({
      criterias: { programBookId: programBooks.map(x => x.id) }
    });
    if (projectFindOptionsResult.isFailure) {
      return projectFindOptionsResult;
    }

    const projects: IEnrichedProject[] = await projectRepository.findAll(projectFindOptionsResult.getValue());
    if (!isEmpty(projects)) {
      return Result.fail(
        Guard.error(
          'year, executorId',
          ErrorCodes.AnnualProgramHasProjectsAssigned,
          `It's impossible to change year or executor of an annual program with projects`
        )
      );
    }
    return Result.ok();
  }

  private static async validateUpdateStatus(
    inputAnnualProgram: PlainAnnualProgram<IPlainAnnualProgramProps>,
    currentAnnualProgram: AnnualProgram
  ): Promise<Result<void>> {
    if (inputAnnualProgram.status === currentAnnualProgram.status) {
      return Result.ok();
    }
    const results: Result<any>[] = [Result.ok()];

    if (inputAnnualProgram.status === AnnualProgramStatus.submittedFinal) {
      const sharedRoles = await taxonomyService.getTaxonomyValueString<Role>(
        TaxonomyGroup.shareableRole,
        ShareableRole.annualProgram
      );
      const isSharedToAll = sharedRoles.every(role => inputAnnualProgram.sharedRoles.includes(role));
      if (!isSharedToAll) {
        results.push(
          Result.fail(
            Guard.errorForbidden({
              argument: inputAnnualProgram.sharedRoles,
              argumentName: `The Annual Program should be shared to all of those roles: ${sharedRoles.toString()}`
            })
          )
        );
      }

      currentAnnualProgram?.programBooks
        ?.filter(
          programBook =>
            ![ProgramBookStatus.submittedPreliminary, ProgramBookStatus.submittedFinal].includes(programBook.status)
        )
        .forEach(programBook =>
          results.push(
            Result.fail(
              Guard.errorForbidden({
                argument: programBook.status,
                argumentName: `programBook ${programBook.id} has a wrong status ${programBook.status}`
              })
            )
          )
        );
      return Result.combine(results);
    }
    return Result.ok();
  }

  public static validateRestrictions(annualProgram: PlainAnnualProgram<any>): Result<IGuardResult> {
    const restrictions: IRestriction = {
      EXECUTOR: [annualProgram.executorId]
    };
    return RestrictionsValidator.validate(ANNUAL_PROGRAM_RESTRICTION_TYPES, restrictions);
  }

  protected get model(): AnnualProgramModel {
    return db().models.AnnualProgram;
  }

  protected getOpenApiModelName() {
    return 'PlainAnnualProgram';
  }
}
export const annualProgramValidator = new AnnualProgramValidator();
