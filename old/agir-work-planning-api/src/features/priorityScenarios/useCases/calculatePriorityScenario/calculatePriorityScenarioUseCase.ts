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
import { priorityScenarioMapperDTO } from '../../mappers/priorityScenarioMapperDTO';
import { PriorityScenario } from '../../models/priorityScenario';
import { programBookPriorityScenarioService } from '../../priorityScenarioService';
import { ProgramBookPriorityScenarioValidator } from '../../validators/priorityScenarioValidator';
import {
  CalculatePriorityScenarioCommand,
  ICalculatePriorityScenarioCommandProps
} from './calculatePriorityScenarioCommand';

export class CalculatePriorityScenarioUseCase extends UseCase<
  ICalculatePriorityScenarioCommandProps,
  IEnrichedProgramBook
> {
  public async execute(req: ICalculatePriorityScenarioCommandProps): Promise<Response<IEnrichedProgramBook>> {
    const calculatePriorityScenarioCmdResult = CalculatePriorityScenarioCommand.create(req);

    if (calculatePriorityScenarioCmdResult.isFailure) {
      return left(new InvalidParameterError(calculatePriorityScenarioCmdResult.errorValue()));
    }
    const calculatePriorityScenarioCmd: CalculatePriorityScenarioCommand = calculatePriorityScenarioCmdResult.getValue();
    const programBook: ProgramBook = await programBookRepository.findById(calculatePriorityScenarioCmd.programBookId, [
      ProgramBookExpand.projectsInterventions,
      ProgramBookExpand.annualProgram
    ]);
    if (!programBook) {
      return left(
        new NotFoundError(`Could not find the program book with ID: '${calculatePriorityScenarioCmd.programBookId}'`)
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
      p => p.id === calculatePriorityScenarioCmd.priorityScenarioId
    );
    if (!priorityScenario) {
      return left(
        new NotFoundError(
          `Could not find the priority scenario with ID: '${calculatePriorityScenarioCmd.priorityScenarioId}'`
        )
      );
    }

    const businessRulesResult = Result.combine([
      ProgramBookPriorityScenarioValidator.validateBusinessRulesForCalculate(programBook, priorityScenario),
      ProgramBookValidator.validateIsAutomaticLoadingInProgress(programBook)
    ]);
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const orderedProjectsWithObjectiveCalculations = (
      await priorityScenarioMapperDTO.getFromModel(priorityScenario, { programBook, objectivesCalculation: true })
    ).orderedProjects.items;
    const calculatedOrderedProjects = await programBookPriorityScenarioService.getPriorityScenarioOrderedProjects(
      priorityScenario,
      programBook.projects,
      programBook.annualProgram.year,
      orderedProjectsWithObjectiveCalculations,
      programBook.objectives
    );

    const updatedPriorityScenarioResult = PriorityScenario.create(
      {
        id: priorityScenario.id,
        name: priorityScenario.name,
        priorityLevels: priorityScenario.priorityLevels,
        orderedProjects: calculatedOrderedProjects,
        isOutdated: false,
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
      expand: [ProgramBookExpand.projects]
    });
    if (savedProgramBookResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedProgramBookResult)));
    }
    return right(
      Result.ok<IEnrichedProgramBook>(
        await programBookMapperDTO.getFromModel(savedProgramBookResult.getValue(), {
          hasAnnualProgram: true,
          hasProjects: true,
          objectivesCalculation: true
        })
      )
    );
  }
}

export const calculatePriorityScenarioUseCase = new CalculatePriorityScenarioUseCase();
