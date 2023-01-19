import {
  ANNUAL_PROGRAM_STATUSES_CAN_CHANGE_PROGRAM_BOOKS,
  AnnualProgramStatus,
  BoroughCode,
  ErrorCodes,
  IApiError,
  IEnrichedProject,
  ITaxonomy,
  IUuid,
  ProgramBookStatus,
  ProjectStatus,
  ProjectType,
  ShareableRole,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { isEqual } from 'lodash';

import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Guard, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import {
  PROGRAM_BOOK_RESTRICTION_TYPES,
  RestrictionsValidator
} from '../../../shared/restrictions/restrictionsValidator';
import { IRestriction } from '../../../shared/restrictions/userRestriction';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { isEmpty } from '../../../utils/utils';
import { annualPeriodMapperDTO } from '../../annualPeriods/mappers/annualPeriodMapperDTO';
import { ProjectAnnualPeriod } from '../../annualPeriods/models/projectAnnualPeriod';
import { ProjectAnnualPeriodValidator } from '../../annualPeriods/validators/projectAnnualPeriodValidator';
import { AnnualProgram } from '../../annualPrograms/models/annualProgram';
import { interventionRepository } from '../../interventions/mongo/interventionRepository';
import { ProjectFindOptions } from '../../projects/models/projectFindOptions';
import { projectRepository } from '../../projects/mongo/projectRepository';
import { ProjectValidator } from '../../projects/validators/projectValidator';
import { taxonomyService } from '../../taxonomies/taxonomyService';
import { taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';
import { IPlainProgramBookProps, PlainProgramBook } from '../models/plainProgramBook';
import { ProgramBook } from '../models/programBook';
import { IProgramBookCommandProps } from '../useCases/programBookCommand';
import { IUpdateProgramBookCommandProps } from '../useCases/updateProgramBook/updateProgramBookCommand';

export const PROGRAMBOOK_PROGRAMMABLE_STATUSES = [
  ProgramBookStatus.programming,
  ProgramBookStatus.submittedPreliminary,
  ProgramBookStatus.submittedFinal
];
export class ProgramBookValidator {
  public static async validateAgainstOpenApi(
    programBookInput: IProgramBookCommandProps
  ): Promise<Result<IGuardResult>> {
    return openApiInputValidator.validateOpenApiModel('PlainProgramBook', programBookInput);
  }

  public static async validateAgainstTaxonomies(
    inputProgramBook: IPlainProgramBookProps
  ): Promise<Result<IGuardResult>> {
    const errors: IApiError[] = [];
    await taxonomyValidator.validate(errors, TaxonomyGroup.projectType, inputProgramBook.projectTypes);
    if (inputProgramBook.boroughIds) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.borough, inputProgramBook.boroughIds);
    }
    if (inputProgramBook.sharedRoles) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.role, inputProgramBook.sharedRoles);
    }
    if (inputProgramBook.programTypes) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.programType, inputProgramBook.programTypes);
    }
    if (!isEmpty(errors)) {
      return Result.combine(
        errors.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCode, error.message));
        })
      );
    }
    return Result.ok();
  }

  public static async validateCommonBusinessRules(
    annualProgram: AnnualProgram,
    inputProgramBook: PlainProgramBook<IPlainProgramBookProps>,
    programBookId?: IUuid
  ): Promise<Result<IGuardResult>> {
    return Result.combine([
      this.validateBoroughIds(inputProgramBook.boroughIds),
      this.canChangeProgramBook(annualProgram),
      this.validateCanShareRoles(inputProgramBook, programBookId),
      await this.validateSharedTaxonomies(inputProgramBook),
      await this.validateSharedRolesWhenSubmittedFinal(inputProgramBook)
    ]);
  }

  public static async validateUpdateBusinessRules(
    annualProgram: AnnualProgram,
    inputProgramBook: PlainProgramBook<IPlainProgramBookProps>,
    currentProgramBook: ProgramBook
  ): Promise<Result<IGuardResult>> {
    const projects = await projectRepository.findAll(
      ProjectFindOptions.create({
        criterias: {
          programBookId: currentProgramBook.id
        }
      }).getValue()
    );
    return Result.combine([
      await this.validateCommonBusinessRules(annualProgram, inputProgramBook, currentProgramBook.id),
      this.validateProjectsType(inputProgramBook.projectTypes, projects),
      this.validateProjectsBorough(inputProgramBook, projects),
      this.validateUpdateStatus(inputProgramBook, currentProgramBook, projects),
      this.validateIsAutomaticLoadingInProgress(currentProgramBook),
      await this.validatePrograms(inputProgramBook.programTypes, projects)
    ]);
  }

  public static validateDeleteBusinessRules(programBook: ProgramBook): Result<IGuardResult> {
    const results: Result<any>[] = [Result.ok()];
    const nonDeletableProjectsStatuses = [
      ProjectStatus.finalOrdered,
      ProjectStatus.planned,
      ProjectStatus.postponed,
      ProjectStatus.preliminaryOrdered,
      ProjectStatus.programmed,
      ProjectStatus.replanned
    ];

    const resultsProjectStatuses: boolean[] = programBook.projects.map(project =>
      nonDeletableProjectsStatuses.includes(project.status as ProjectStatus)
    ); // TODO remove as when projet domain class
    if (resultsProjectStatuses.find(r => r)) {
      results.push(
        Result.fail(
          Guard.error(
            'projects',
            ErrorCodes.ProgramBookHasProject,
            `The program book must not have a project to be deleted.`
          )
        )
      );
    }
    if (!programBook.canDelete()) {
      results.push(
        Result.fail(
          Guard.error('status', ErrorCodes.InvalidStatus, `The program book is not in a valid state to be deleted.`)
        )
      );
    }
    results.push(this.validateIsAutomaticLoadingInProgress(programBook));
    return Result.combine(results);
  }

  public static validateRestrictions(executorId: string, boroughIds: string[]): Result<IGuardResult> {
    const restrictions: IRestriction = {
      BOROUGH: boroughIds || [],
      EXECUTOR: [executorId]
    };
    return RestrictionsValidator.validate(PROGRAM_BOOK_RESTRICTION_TYPES, restrictions);
  }

  public static async validateProgramProjectBusinessRules(
    programBook: ProgramBook,
    project: IEnrichedProject,
    annualPeriod: ProjectAnnualPeriod
  ): Promise<Result<IGuardResult>> {
    return Result.combine([
      ProjectValidator.validateCanInteract(project),
      this.validateProgramBookProgramableProjectStatus(programBook),
      this.validateAnnualProgramHasProgrammableStatus(programBook.annualProgram),
      this.validateProjectsType(programBook.projectTypes, [project]),
      await this.validatePrograms(programBook.programTypes, [project]),
      this.validateProjectBorough(project, programBook.boroughIds),
      ProjectAnnualPeriodValidator.validateProgramBookIdByAnnualProgram(annualPeriod, programBook.annualProgram),
      ProjectAnnualPeriodValidator.validateAnnualPeriodsStatus(
        await Promise.all(
          project.annualDistribution.annualPeriods.map(async ap => {
            let result = ap;
            if (ap.year === annualPeriod.year) {
              const annualPeriodEnriched = await annualPeriodMapperDTO.getFromModel(annualPeriod);
              annualPeriodEnriched.programBookId = programBook.id;
              annualPeriodEnriched.status = ProjectStatus.programmed;
              result = annualPeriodEnriched;
            }
            return ProjectAnnualPeriod.fromEnrichedToInstance(result);
          })
        )
      ),
      this.validateProjectYear(programBook.annualProgram, project),
      this.validateIsAutomaticLoadingInProgress(programBook)
    ]);
  }

  public static validateIsAutomaticLoadingInProgress(programBook: ProgramBook): Result<IGuardResult> {
    if (programBook.isAutomaticLoadingInProgress) {
      return Result.fail(
        Guard.error(
          'isAutomaticLoadingInProgress',
          ErrorCodes.ProgramBookIsAutomaticLoadingInProgress,
          `A program book is no longer accessible for modification during an automatic loading ${programBook.isAutomaticLoadingInProgress}`
        )
      );
    }
    return Result.ok();
  }

  public static validateAutomaticLoading(programBook: ProgramBook): Result<IGuardResult> {
    return Result.combine([
      this.validateIsAutomaticLoadingInProgress(programBook),
      this.validateProgramBookStatusToAutomaticLoading(programBook)
    ]);
  }

  private static validateBoroughIds(boroughIds: string[]): Result<void> {
    if (boroughIds && boroughIds.length > 1 && boroughIds.includes('MTL')) {
      return Result.fail(
        Guard.error(
          'boroughIds',
          ErrorCodes.BoroughUniqueMTL,
          `Cannot create or update a program book with more than 1 borough if you selected MTL.`
        )
      );
    }
    return Result.ok();
  }

  private static canChangeProgramBook(annualProgram: AnnualProgram): Result<void> {
    if (!ANNUAL_PROGRAM_STATUSES_CAN_CHANGE_PROGRAM_BOOKS.includes(annualProgram.status)) {
      return Result.fail(
        Guard.error(
          'annualProgram.status',
          ErrorCodes.InvalidStatus,
          'Cannot update program book. Invalid annual program status.'
        )
      );
    }
    return Result.ok();
  }

  private static validateCanShareRoles(programBook: PlainProgramBook<IPlainProgramBookProps>, programBookId: IUuid) {
    if (!isEmpty(programBook.sharedRoles)) {
      const resultErrors: Result<void>[] = [];
      if (isEmpty(programBookId)) {
        resultErrors.push(
          Result.fail(
            Guard.error(
              'sharedRole',
              ErrorCodes.ProgramBookSharedRole,
              `Program book can not be created with shared roles`
            )
          )
        );
      }
      if (programBook.status === ProgramBookStatus.new) {
        resultErrors.push(
          Result.fail(
            Guard.error(
              'sharedRole',
              ErrorCodes.ProgramBookSharedRole,
              `Program book shared roles can not be add or modify with the status ${programBook.status}`
            )
          )
        );
      }
      if (!isEmpty(resultErrors)) {
        return Result.combine(resultErrors);
      }
    }
    return Result.ok();
  }

  private static async validateSharedTaxonomies(
    programBookProps: PlainProgramBook<IPlainProgramBookProps>
  ): Promise<Result<void>> {
    const taxonomies: ITaxonomy[] = await taxonomyService.getGroup(TaxonomyGroup.shareableRole);

    const taxonomy: ITaxonomy = taxonomies.find(taxo => taxo.code === ShareableRole.programBook);
    const resultErrors: Result<void>[] = [];
    for (const role of programBookProps.sharedRoles) {
      if (!taxonomy.valueString1.includes(role)) {
        resultErrors.push(
          Result.fail(
            Guard.error(
              'sharedRole',
              ErrorCodes.ProgramBookSharedRole,
              `That program book can not be shared with role : ${role}`
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

  private static async validateSharedRolesWhenSubmittedFinal(
    inpoutPprogramBook: PlainProgramBook<IPlainProgramBookProps>
  ): Promise<Result<void>> {
    if (inpoutPprogramBook.status !== ProgramBookStatus.submittedFinal) {
      return Result.ok();
    }

    const taxonomySharedRoles: string[] = await taxonomyService.getTaxonomyValueString(
      TaxonomyGroup.shareableRole,
      ShareableRole.programBook
    );
    const resultErrors: Result<void>[] = [];

    if (
      isEmpty(inpoutPprogramBook.sharedRoles) ||
      !isEqual(taxonomySharedRoles.sort(), inpoutPprogramBook.sharedRoles?.sort())
    ) {
      resultErrors.push(
        Result.fail(
          Guard.error(
            'sharedRoles',
            ErrorCodes.ProgramBookNotSharedEntirely,
            `The shared roles of the program book does not match the taxonomy`
          )
        )
      );
    }

    if (!isEmpty(resultErrors)) {
      return Result.combine(resultErrors);
    }
    return Result.ok();
  }

  private static validateProjectsType(projectTypes: ProjectType[], projects: IEnrichedProject[]): Result<void> {
    const resultErrors: Result<void>[] = [];
    for (const project of projects) {
      if (!projectTypes.includes(project.projectTypeId as ProjectType)) {
        // TODO remove as when project is domain object
        resultErrors.push(
          Result.fail(
            Guard.error(
              'projectTypes',
              ErrorCodes.ProgramBookProjectTypes,
              `Project has ${
                project.projectTypeId
              } as projectTypeId and programBook contains only those projectTypes : ${projectTypes.join(', ')}`
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

  private static async validatePrograms(programIds: string[], projects: IEnrichedProject[]): Promise<Result<void>> {
    if (isEmpty(programIds)) {
      return Result.ok();
    }
    const resultErrors: Result<void>[] = [];
    for (const project of projects) {
      // If the project is of type PNI, it only has 1 intervention. The project must be of type PNI to contain an intervention with programs.
      const intervention = await interventionRepository.findById(project.interventionIds[0]);
      if (!programIds.includes(intervention.programId)) {
        // TODO remove as when project is domain object
        resultErrors.push(
          Result.fail(
            Guard.error(
              'programTypes',
              ErrorCodes.ProgramBookProjectTypes,
              `Project's intervention has ${
                intervention.programId
              } as programId and programBook contains only those programTypes : ${programIds.join(', ')}`
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

  private static validateProjectsBorough(
    input: IUpdateProgramBookCommandProps,
    projects: IEnrichedProject[]
  ): Result<void> {
    const resultErrors: Result<void>[] = [];

    if (input.boroughIds && input.boroughIds.includes(BoroughCode.MTL)) {
      return Result.ok();
    }

    for (const project of projects) {
      if (input.boroughIds && !input.boroughIds.includes(project.boroughId)) {
        resultErrors.push(
          Result.fail(
            Guard.error(
              'boroughIds',
              ErrorCodes.ProgramBookBoroughs,
              `Project has ${
                project.boroughId
              } as boroughId and programBook contains only those boroughIds : ${input.boroughIds.join(', ')}`
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

  private static validateProgramBookProgramableProjectStatus(programBook: ProgramBook): Result<any> {
    if (!PROGRAMBOOK_PROGRAMMABLE_STATUSES.includes(programBook.status)) {
      return Result.fail(
        Guard.error(
          'status',
          ErrorCodes.InvalidStatus,
          `Cannot program a project. Program book status should be one of ${PROGRAMBOOK_PROGRAMMABLE_STATUSES.join(
            ','
          )}.`
        )
      );
    }
    return Result.ok();
  }

  private static validateAnnualProgramHasProgrammableStatus(annualProgram: AnnualProgram): Result<any> {
    if (!annualProgram.isProgrammable()) {
      return Result.fail(
        Guard.error(
          'status',
          ErrorCodes.InvalidStatus,
          `Cannot program a project. Annual program status is different of ${AnnualProgramStatus.programming}.`
        )
      );
    }
    return Result.ok();
  }

  private static validateProjectBorough(project: IEnrichedProject, boroughIds: string[]): Result<any> {
    if (isEmpty(boroughIds) || boroughIds.includes(BoroughCode.MTL)) {
      return Result.ok();
    }
    if (!boroughIds.includes(project.boroughId)) {
      return Result.fail(
        Guard.error(
          'boroughIds',
          ErrorCodes.ProgramBookBoroughs,
          `Projects borough must be one of these borough : ${boroughIds.join(', ')}`
        )
      );
    }
    return Result.ok();
  }

  private static validateProjectYear(annualProgram: AnnualProgram, project: IEnrichedProject): Result<void> {
    if (!(project.startYear <= annualProgram.year && project.endYear >= annualProgram.year)) {
      return Result.fail(
        Guard.error(
          'projectTypes',
          ErrorCodes.ProgramBookProjectYear,
          `Project year ${project.startYear} to ${project.endYear} is outside the annual program year : ${annualProgram.year}`
        )
      );
    }
    return Result.ok();
  }

  private static validateUpdateStatus(
    inputProgramBook: PlainProgramBook<IPlainProgramBookProps>,
    currentProgramBook: ProgramBook,
    projects: IEnrichedProject[]
  ): Result<void> {
    if (inputProgramBook.status === currentProgramBook.status) {
      return Result.ok();
    }
    if (inputProgramBook.status === ProgramBookStatus.submittedPreliminary) {
      const projectsIdsWithoutDrmNumber: string[] = [];
      for (const project of projects) {
        if (isEmpty(project.drmNumber)) {
          projectsIdsWithoutDrmNumber.push(project.id);
        }
      }
      if (!isEmpty(projectsIdsWithoutDrmNumber)) {
        return Result.fail(
          Guard.error(
            'projects.drm',
            ErrorCodes.ProjectNoDrmNumber,
            `Missing drm number on projects: ${projectsIdsWithoutDrmNumber.join(',')}`
          )
        );
      }
    }
    return Result.ok();
  }

  private static validateProgramBookStatusToAutomaticLoading(programBook: ProgramBook): Result<void> {
    if (![ProgramBookStatus.programming, ProgramBookStatus.submittedPreliminary].includes(programBook.status)) {
      return Result.fail(
        Guard.error(
          'status',
          ErrorCodes.InvalidStatus,
          `Cannot run automatic loading. Program book status is different of ${ProgramBookStatus.programming} or ${ProgramBookStatus.submittedPreliminary}.`
        )
      );
    }
    return Result.ok();
  }
}
