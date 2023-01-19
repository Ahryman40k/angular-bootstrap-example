import { IEnrichedProgramBook, ProgramBookExpand } from '@villemontreal/agir-work-planning-lib';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { programBookMapperDTO } from '../../../programBooks/mappers/programBookMapperDTO';
import { ProgramBook } from '../../../programBooks/models/programBook';
import { programBookRepository } from '../../../programBooks/mongo/programBookRepository';
import { PriorityScenario } from '../../models/priorityScenario';
import {
  GetPriorityScenarioOrderedProjectsCommand,
  IGetPriorityScenarioOrderedProjectsProps
} from './getPriorityScenarioOrderedProjectsCommand';

export class GetPriorityScenarioOrderedProjectsUseCase extends UseCase<
  IGetPriorityScenarioOrderedProjectsProps,
  IEnrichedProgramBook
> {
  public async execute(req: IGetPriorityScenarioOrderedProjectsProps): Promise<Response<IEnrichedProgramBook>> {
    const [searchCommandResult, openApiResult] = await Promise.all([
      GetPriorityScenarioOrderedProjectsCommand.create(req),
      Result.ok() // ProgramBookPriorityScenarioValidator.validateOrderedProjectsSearchRequest(omit(req, ['programBookId', 'priorityScenarioId']))
    ]);
    const inputValidationResult = Result.combine([searchCommandResult, openApiResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }

    const searchCommand: GetPriorityScenarioOrderedProjectsCommand = searchCommandResult.getValue();
    const programBook: ProgramBook = await programBookRepository.findById(searchCommand.programBookId, [
      ProgramBookExpand.projectsInterventions
    ]);
    if (!programBook) {
      return left(new NotFoundError(`Could not find the program book with ID: '${searchCommand.programBookId}'`));
    }
    const priorityScenario: PriorityScenario = programBook.priorityScenarios.find(
      p => p.id === searchCommand.priorityScenarioId
    );
    if (!priorityScenario) {
      return left(
        new NotFoundError(`Could not find the priority scenario with ID: '${searchCommand.priorityScenarioId}'`)
      );
    }

    return right(
      Result.ok<IEnrichedProgramBook>(
        await programBookMapperDTO.getFromModel(programBook, {
          priorityScenarioId: priorityScenario.id,
          projectLimit: searchCommand.projectLimit,
          projectOrderBy: searchCommand.projectOrderBy,
          projectOffset: searchCommand.projectOffset,
          hasAnnualProgram: true,
          hasProjects: true,
          objectivesCalculation: true
        })
      )
    );
  }
}

export const getPriorityScenarioOrderedProjectsUseCase = new GetPriorityScenarioOrderedProjectsUseCase();
