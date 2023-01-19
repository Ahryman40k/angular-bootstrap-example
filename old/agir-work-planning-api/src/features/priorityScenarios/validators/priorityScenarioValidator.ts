import {
  ErrorCodes,
  IApiError,
  IOrderedProject,
  IOrderedProjectsPaginatedSearchRequest,
  IProjectRank,
  ProgramBookStatus
} from '@villemontreal/agir-work-planning-lib';
import { isEmpty, some } from 'lodash';

import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { ProgramBook } from '../../programBooks/models/programBook';
import { PriorityScenario } from '../models/priorityScenario';
import { IProjectRankProps, ProjectRank } from '../models/projectRank';

export const PRIORITY_SCENARIO_ALLOWED_PROGRAM_BOOK_STATUSES = [
  ProgramBookStatus.new,
  ProgramBookStatus.programming,
  ProgramBookStatus.submittedPreliminary,
  ProgramBookStatus.submittedFinal
];
/**
 * Validates program book priority scenario models.
 */
export class ProgramBookPriorityScenarioValidator {
  public static validateProgramBookStatus(programBook: ProgramBook, status?: ProgramBookStatus[]): Result<any> {
    const allowedStatus = isEmpty(status) ? PRIORITY_SCENARIO_ALLOWED_PROGRAM_BOOK_STATUSES : status;
    if (!allowedStatus.includes(programBook.status)) {
      return Result.fail(
        Guard.error(
          'status',
          ErrorCodes.InvalidStatus,
          `Program book status is different of ${allowedStatus.toString()}.`
        )
      );
    }
    return Result.ok();
  }

  public static async validateOrderedProjectsSearchRequest(
    searchRequest: IOrderedProjectsPaginatedSearchRequest
  ): Promise<Result<any>> {
    if (isEmpty(searchRequest)) {
      Result.ok();
    }
    const errors: IApiError[] = [];
    await openApiInputValidator.validateInputModel(errors, 'OrderedProjectsPaginatedSearchRequest', searchRequest);
    if (!isEmpty(errors)) {
      return Result.fail(
        Guard.error('OrderedProjectsPaginatedSearchRequest', ErrorCodes.InvalidInput, `Invalid search request`)
      );
    }
    return Result.ok();
  }

  public static validateBusinessRulesForCalculate(
    programBook: ProgramBook,
    priorityScenario: PriorityScenario
  ): Result<any> {
    return Result.combine([
      this.validateProgramBookStatus(programBook),
      this.validatePriorityScenarioOutdated(priorityScenario)
    ]);
  }

  private static validatePriorityScenarioOutdated(priorityScenario: PriorityScenario): Result<void> {
    if (!priorityScenario.isOutdated) {
      return Result.fail(Guard.error('isOutdated', ErrorCodes.InvalidInput, 'The priority scenario is not outdated.'));
    }
    return Result.ok();
  }

  public static async validateProjectRankAgainstOpenApi(projectRankInput: IProjectRankProps): Promise<Result<any>> {
    return openApiInputValidator.validateOpenApiModel('ProjectRank', projectRankInput);
  }

  public static validateBusinessRulesForProjectRankManualUpdate(
    orderedProjects: IOrderedProject[],
    projectId: string,
    projectRank: ProjectRank
  ): Result<any> {
    return Result.combine([
      this.validateInputProjectRankExist(orderedProjects, projectRank),
      this.validateRankNotAlreadyAssigned(orderedProjects, projectId, projectRank)
    ]);
  }

  private static validateInputProjectRankExist(orderedProjects: IOrderedProject[], input: IProjectRank): Result<any> {
    const isRankAlreadyExist = some(orderedProjects, orderedProject => orderedProject.rank === input.newRank);
    if (!isRankAlreadyExist) {
      return Result.fail(
        Guard.error(
          'priorityScenario.orderedProjects.rank',
          ErrorCodes.InvalidInput,
          `Program book priority scenario ordered project rank doesn't exist`
        )
      );
    }
    return Result.ok();
  }

  private static validateRankNotAlreadyAssigned(
    orderedProjects: IOrderedProject[],
    projectId: string,
    projectRank: ProjectRank
  ): Result<any> {
    const isRankAreadyPresent = some(
      orderedProjects,
      orderedProject =>
        orderedProject.projectId !== projectId &&
        orderedProject.isManuallyOrdered &&
        orderedProject.rank === projectRank.newRank
    );
    if (isRankAreadyPresent) {
      return Result.fail(
        Guard.error(
          'priorityScenario.orderedProjects.rank',
          ErrorCodes.Duplicate,
          `The manually ordered project’s rank has already been assigned to another project in the priority scenario`
        )
      );
    }
    return Result.ok();
  }
}

export const programBookPriorityScenarioValidator = new ProgramBookPriorityScenarioValidator();
