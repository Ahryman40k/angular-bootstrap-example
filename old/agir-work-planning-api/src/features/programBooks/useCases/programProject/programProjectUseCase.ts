import { IEnrichedProject, ProgramBookExpand, ProjectExpand } from '@villemontreal/agir-work-planning-lib';
import { cloneDeep } from 'lodash';

import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { annualPeriodMapperDTO } from '../../../annualPeriods/mappers/annualPeriodMapperDTO';
import { ProjectAnnualPeriod } from '../../../annualPeriods/models/projectAnnualPeriod';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { ProgramBook } from '../../models/programBook';
import { programBookRepository } from '../../mongo/programBookRepository';
import { programBookService } from '../../programBookService';
import { ProgramBookValidator } from '../../validators/programBookValidator';
import { IProgramProjectCommandProps, ProgramProjectCommand } from './programProjectCommand';

export class ProgramProjectUseCase extends UseCase<IProgramProjectCommandProps, IEnrichedProject> {
  public async execute(req: IProgramProjectCommandProps): Promise<Response<IEnrichedProject>> {
    const programProjectCmdResult = ProgramProjectCommand.create(req);

    if (programProjectCmdResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(programProjectCmdResult)));
    }
    const programProjectCmd: ProgramProjectCommand = programProjectCmdResult.getValue();
    const programBook: ProgramBook = await programBookRepository.findById(programProjectCmd.programBookId, [
      ProgramBookExpand.removedProjects,
      ProgramBookExpand.annualProgram
    ]);
    if (!programBook) {
      return left(new NotFoundError(`Could not find the program book with ID: '${programProjectCmd.programBookId}'`));
    }
    if (!programBook.annualProgram) {
      return left(new NotFoundError(`Could not find the annual program with ID: '${programBook.annualProgram.id}'`));
    }
    const restrictionResult = ProgramBookValidator.validateRestrictions(
      programBook.annualProgram.executorId,
      programBook.boroughIds
    );
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(restrictionResult.errorValue()));
    }
    const project: IEnrichedProject = await projectRepository.findById(programProjectCmd.projectId, [
      ProjectExpand.interventions
    ]);
    if (!project) {
      return left(new NotFoundError(`Could not find the project with ID: '${programProjectCmd.projectId}'`));
    }
    const annualPeriod = project.annualDistribution.annualPeriods.find(x => x.year === programBook.annualProgram.year);
    if (!annualPeriod) {
      return left(new NotFoundError(`Could not find the annualPeriod with year: '${programBook.annualProgram.year}'`));
    }

    // TODO REMOVE WHEN PROJECT IS REFACTORED
    const annualPeriodWithPBIndex = project.annualDistribution.annualPeriods.findIndex(
      x => x.year === programBook.annualProgram.year
    );

    const annualPeriodInstance = await ProjectAnnualPeriod.fromEnrichedToInstance(annualPeriod);
    const businessRulesResult = await ProgramBookValidator.validateProgramProjectBusinessRules(
      programBook,
      project,
      annualPeriodInstance
    );
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    // TODO REFACTOR AND DELETE SERVICE -----------------------
    const originalProject = cloneDeep(project);
    await programBookService.programProject(project, programBook, annualPeriodInstance, false);
    project.annualDistribution.annualPeriods[annualPeriodWithPBIndex] = await annualPeriodMapperDTO.getFromModel(
      annualPeriodInstance
    );

    const persistedProjectResult = await projectRepository.save(project);
    if (persistedProjectResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(persistedProjectResult)));
    }
    programBookService.applyProjectDecisionOnProgramBook(
      programBook,
      originalProject,
      persistedProjectResult.getValue()
    );

    // Compute objetives if needed / force reload to get all projects + added one
    await programBook.computeObjectives(true);

    const savedProgramBook = await programBookRepository.save(programBook);
    if (savedProgramBook.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedProgramBook)));
    }
    // TODO REFACTOR AND DELETE SERVICE ------------------------------------

    return right(Result.ok<IEnrichedProject>(persistedProjectResult.getValue()));
  }
}

export const programProjectUseCase = new ProgramProjectUseCase();
