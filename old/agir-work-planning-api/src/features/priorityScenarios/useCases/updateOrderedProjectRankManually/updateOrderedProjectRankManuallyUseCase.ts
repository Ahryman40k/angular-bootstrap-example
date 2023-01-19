import { IEnrichedProgramBook, ProgramBookExpand } from '@villemontreal/agir-work-planning-lib';

import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { Audit } from '../../../audit/audit';
import { programBookMapperDTO } from '../../../programBooks/mappers/programBookMapperDTO';
import { ProgramBook } from '../../../programBooks/models/programBook';
import { programBookRepository } from '../../../programBooks/mongo/programBookRepository';
import { ProgramBookValidator } from '../../../programBooks/validators/programBookValidator';
import { OrderedProject } from '../../models/orderedProject';
import { PriorityScenario } from '../../models/priorityScenario';
import { programBookPriorityScenarioService } from '../../priorityScenarioService';
import { ProgramBookPriorityScenarioValidator } from '../../validators/priorityScenarioValidator';
import {
  IUpdateOrderedProjectRankManuallyCommandProps,
  UpdateOrderedProjectRankManuallyCommand
} from './updateOrderedProjectRankManuallyCommand';

export class UpdateOrderedProjectRankManuallyUseCase extends UseCase<
  IUpdateOrderedProjectRankManuallyCommandProps,
  IEnrichedProgramBook
> {
  public async execute(req: IUpdateOrderedProjectRankManuallyCommandProps): Promise<Response<IEnrichedProgramBook>> {
    const [updateOrderedProjectRankManuallyCmdResult, openApiResult] = await Promise.all([
      UpdateOrderedProjectRankManuallyCommand.create(req),
      ProgramBookPriorityScenarioValidator.validateProjectRankAgainstOpenApi(req.projectRank)
    ]);

    const inputValidationResult = Result.combine([updateOrderedProjectRankManuallyCmdResult, openApiResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }
    const updateOrderedProjectRankManuallyCmd: UpdateOrderedProjectRankManuallyCommand = updateOrderedProjectRankManuallyCmdResult.getValue();
    const programBook: ProgramBook = await programBookRepository.findById(
      updateOrderedProjectRankManuallyCmd.programBookId,
      [ProgramBookExpand.annualProgram]
    );
    if (!programBook) {
      return left(
        new NotFoundError(
          `Could not find the program book with ID: '${updateOrderedProjectRankManuallyCmd.programBookId}'`
        )
      );
    }
    const restrictionResult = ProgramBookValidator.validateRestrictions(
      programBook.annualProgram.executorId,
      programBook.boroughIds
    );
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(restrictionResult.errorValue()));
    }
    const priorityScenario: PriorityScenario = programBook.priorityScenarios.find(
      p => p.id === updateOrderedProjectRankManuallyCmd.priorityScenarioId
    );
    if (!priorityScenario) {
      return left(
        new NotFoundError(
          `Could not find the priority scenario with ID: '${updateOrderedProjectRankManuallyCmd.priorityScenarioId}'`
        )
      );
    }
    const orderedProjectToUpdate: OrderedProject = priorityScenario.orderedProjects.find(
      p => p.projectId === updateOrderedProjectRankManuallyCmd.projectId
    );
    if (!orderedProjectToUpdate) {
      return left(
        new NotFoundError(`Could not find the project with ID: '${updateOrderedProjectRankManuallyCmd.projectId}'`)
      );
    }
    // business rules
    const businessRulesResult = Result.combine([
      ProgramBookPriorityScenarioValidator.validateBusinessRulesForProjectRankManualUpdate(
        priorityScenario.orderedProjects,
        updateOrderedProjectRankManuallyCmd.projectId,
        updateOrderedProjectRankManuallyCmd.projectRank
      ),
      ProgramBookValidator.validateIsAutomaticLoadingInProgress(programBook)
    ]);
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const reorderedProjects = programBookPriorityScenarioService.updateOrderedProjectsWithNewProjectRank(
      priorityScenario.orderedProjects,
      orderedProjectToUpdate,
      updateOrderedProjectRankManuallyCmd.projectRank
    );

    const updatedPriorityScenarioResult = PriorityScenario.create(
      {
        id: priorityScenario.id,
        name: priorityScenario.name,
        priorityLevels: priorityScenario.priorityLevels,
        orderedProjects: reorderedProjects,
        isOutdated: priorityScenario.isOutdated,
        status: priorityScenario.status,
        audit: Audit.fromUpdateContext(priorityScenario.audit)
      },
      priorityScenario.id
    );

    if (updatedPriorityScenarioResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(updatedPriorityScenarioResult)));
    }
    programBook.addOrReplacePriorityScenario(updatedPriorityScenarioResult.getValue());

    const savedProgramBookResult = await programBookRepository.save(programBook, {
      expand: [ProgramBookExpand.projectsInterventions]
    });
    if (savedProgramBookResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedProgramBookResult)));
    }
    return right(
      Result.ok<IEnrichedProgramBook>(
        await programBookMapperDTO.getFromModel(savedProgramBookResult.getValue(), {
          objectivesCalculation: true
        })
      )
    );
  }
}

export const updateOrderedProjectRankManuallyUseCase = new UpdateOrderedProjectRankManuallyUseCase();
