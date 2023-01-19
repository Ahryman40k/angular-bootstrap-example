import { IEnrichedProgramBook, ProgramBookExpand } from '@villemontreal/agir-work-planning-lib';
import { sortBy } from 'lodash';

import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { AnnualProgram } from '../../../annualPrograms/models/annualProgram';
import { annualProgramRepository } from '../../../annualPrograms/mongo/annualProgramRepository';
import { Audit } from '../../../audit/audit';
import { programBookMapperDTO } from '../../../programBooks/mappers/programBookMapperDTO';
import { ProgramBook } from '../../../programBooks/models/programBook';
import { programBookRepository } from '../../../programBooks/mongo/programBookRepository';
import { ProgramBookValidator } from '../../../programBooks/validators/programBookValidator';
import { PriorityLevel } from '../../models/priorityLevel';
import { PriorityScenario } from '../../models/priorityScenario';
import { programBookPriorityScenarioService } from '../../priorityScenarioService';
import { PriorityLevelsValidator } from '../../validators/priorityLevelsValidator';
import { IUpdatePriorityLevelsCommandProps, UpdatePriorityLevelsCommand } from './updatePriorityLevelsCommand';

export class UpdatePriorityLevelsUseCase extends UseCase<IUpdatePriorityLevelsCommandProps, IEnrichedProgramBook> {
  public async execute(req: IUpdatePriorityLevelsCommandProps): Promise<Response<IEnrichedProgramBook>> {
    // Validate inputs
    const [updatePriorityLevelsCmdResult, openApiResult, taxonomyResult] = await Promise.all([
      UpdatePriorityLevelsCommand.create(req),
      PriorityLevelsValidator.validateAgainstOpenApiBulk(req.priorityLevels),
      PriorityLevelsValidator.validateTaxonomy(req.priorityLevels)
    ]);

    const inputValidationResult = Result.combine([updatePriorityLevelsCmdResult, openApiResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }
    const updatePriorityLevelsCmd: UpdatePriorityLevelsCommand = updatePriorityLevelsCmdResult.getValue();
    const programBook: ProgramBook = await programBookRepository.findById(updatePriorityLevelsCmd.programBookId, [
      ProgramBookExpand.projectsInterventions,
      ProgramBookExpand.annualProgram
    ]);
    if (!programBook) {
      return left(
        new NotFoundError(`Could not find the program book with ID: '${updatePriorityLevelsCmd.programBookId}'`)
      );
    }
    const annualProgram: AnnualProgram = await annualProgramRepository.findById(programBook.annualProgram.id);
    if (!annualProgram) {
      return left(new NotFoundError(`Could not find the annual program with ID: '${programBook.annualProgram.id}'`));
    }
    const restrictionResult = ProgramBookValidator.validateRestrictions(
      programBook.annualProgram.executorId,
      programBook.boroughIds
    );
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(restrictionResult.errorValue()));
    }
    const priorityScenario: PriorityScenario = programBook.priorityScenarios.find(
      p => p.id === updatePriorityLevelsCmd.priorityScenarioId
    );
    if (!priorityScenario) {
      return left(
        new NotFoundError(
          `Could not find the priority scenario with ID: '${updatePriorityLevelsCmd.priorityScenarioId}'`
        )
      );
    }
    // Business Rules
    const businessRulesResult = Result.combine([
      PriorityLevelsValidator.validateBusinessRules(programBook, updatePriorityLevelsCmd.priorityLevels),
      ProgramBookValidator.validateIsAutomaticLoadingInProgress(programBook)
    ]);

    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const priorityLevelsResults: Result<
      PriorityLevel
    >[] = await programBookPriorityScenarioService.updatePriorityLevelsCount(
      updatePriorityLevelsCmd.priorityLevels,
      programBook.projects,
      annualProgram.year,
      programBook
    );
    if (Result.combine(priorityLevelsResults).isFailure) {
      return left(new UnexpectedError(Result.combineForError(Result.combine(priorityLevelsResults))));
    }

    const priorityLevels: PriorityLevel[] = priorityLevelsResults.map(result => result.getValue());
    const updatedPriorityScenarioResult = PriorityScenario.create(
      {
        id: priorityScenario.id,
        name: priorityScenario.name,
        priorityLevels: sortBy(priorityLevels, priorityLevel => priorityLevel.rank),
        orderedProjects: priorityScenario.orderedProjects,
        isOutdated: true,
        status: priorityScenario.status,
        audit: Audit.fromUpdateContext(priorityScenario.audit)
      },
      priorityScenario.id
    );

    if (updatedPriorityScenarioResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(updatedPriorityScenarioResult)));
    }
    programBook.addOrReplacePriorityScenario(updatedPriorityScenarioResult.getValue());

    const savedProgramBookResult = await programBookRepository.save(programBook);
    if (savedProgramBookResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedProgramBookResult)));
    }
    return right(
      Result.ok<IEnrichedProgramBook>(await programBookMapperDTO.getFromModel(savedProgramBookResult.getValue()))
    );
  }
}

export const updatePriorityLevelsUseCase = new UpdatePriorityLevelsUseCase();
