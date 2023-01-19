import { IEnrichedProgramBook, ProgramBookStatus } from '@villemontreal/agir-work-planning-lib';
import { isEmpty, omit } from 'lodash';

import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { annualProgramRepository } from '../../../annualPrograms/mongo/annualProgramRepository';
import { Audit } from '../../../audit/audit';
import { programBookMapperDTO } from '../../mappers/programBookMapperDTO';
import { ProgramBook } from '../../models/programBook';
import { programBookRepository } from '../../mongo/programBookRepository';
import { programBookStateMachine } from '../../programBookStateMachine';
import { ProgramBookValidator } from '../../validators/programBookValidator';
import { IUpdateProgramBookCommandProps, UpdateProgramBookCommand } from './updateProgramBookCommand';

// tslint:disable:cyclomatic-complexity
export class UpdateProgramBookUseCase extends UseCase<IUpdateProgramBookCommandProps, IEnrichedProgramBook> {
  // NOSONAR
  public async execute(req: IUpdateProgramBookCommandProps): Promise<Response<IEnrichedProgramBook>> {
    const [programBookCmdResult, openApiResult, taxonomyResult] = await Promise.all([
      UpdateProgramBookCommand.create(req),
      ProgramBookValidator.validateAgainstOpenApi(omit(req, 'id')),
      ProgramBookValidator.validateAgainstTaxonomies(req)
    ]);

    const inputValidationResult = Result.combine([programBookCmdResult, openApiResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }
    const programBookCmd: UpdateProgramBookCommand = programBookCmdResult.getValue();

    const currentProgramBook = await programBookRepository.findById(programBookCmd.id);
    if (!currentProgramBook) {
      return left(new NotFoundError(`ProgramBook with id ${programBookCmd.id} was not found`));
    }
    const existingAnnualProgram = await annualProgramRepository.findById(currentProgramBook.annualProgram.id);
    if (!existingAnnualProgram) {
      return left(new NotFoundError(`Annual Program with id ${currentProgramBook.annualProgram.id} was not found`));
    }
    // validate old and new programBook
    const restrictionResult = Result.combine([
      ProgramBookValidator.validateRestrictions(existingAnnualProgram.executorId, currentProgramBook.boroughIds),
      ProgramBookValidator.validateRestrictions(existingAnnualProgram.executorId, programBookCmd.boroughIds)
    ]);
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(restrictionResult.errorValue()));
    }

    // Set computed status onto updateCmd
    programBookCmd.setStatus(this.computeProgramBookStatus(currentProgramBook, programBookCmd));

    const businessRulesResults = await ProgramBookValidator.validateUpdateBusinessRules(
      existingAnnualProgram,
      programBookCmd,
      currentProgramBook
    );
    if (businessRulesResults.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResults)));
    }

    const audit: Audit = Audit.fromUpdateContext(currentProgramBook.audit);

    const programBookInstanciateResult = ProgramBook.create(
      {
        boroughIds: programBookCmd.boroughIds || currentProgramBook.boroughIds,
        inCharge: programBookCmd.inCharge || currentProgramBook.inCharge,
        name: programBookCmd.name || currentProgramBook.name,
        projectTypes: programBookCmd.projectTypes || currentProgramBook.projectTypes,
        status: currentProgramBook.status, // status set by stateMachine afterwards TODO review
        annualProgram: existingAnnualProgram,
        objectives: currentProgramBook.objectives,
        projects: currentProgramBook.projects,
        removedProjects: currentProgramBook.removedProjects,
        priorityScenarios: currentProgramBook.priorityScenarios,
        sharedRoles: programBookCmd.sharedRoles || currentProgramBook.sharedRoles,
        programTypes: programBookCmd.programTypes || currentProgramBook.programTypes || [],
        description: programBookCmd.description || currentProgramBook.description,
        isAutomaticLoadingInProgress: currentProgramBook.isAutomaticLoadingInProgress,
        audit
      },
      currentProgramBook.id
    );

    if (programBookInstanciateResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(programBookInstanciateResult)));
    }

    const programBookUpdated = programBookInstanciateResult.getValue();

    if (currentProgramBook.status !== programBookCmd.status) {
      const stateMachineResult = await programBookStateMachine.execute(programBookUpdated, programBookCmd.status);
      if (stateMachineResult.isFailure) {
        return left(new UnprocessableEntityError(Result.combineForError(stateMachineResult)));
      }
      // ANNUAL PROGRAM STATUS IS MODIFIED THROUGH THE PROGRAMBOOK STATE MACHINE
      // ANNUAL PROGRAM MUST IS PERSISTED IN PROGRAMBOOK PRESAVE
    }

    const savedProgramBookResult = await programBookRepository.save(programBookUpdated);
    if (savedProgramBookResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedProgramBookResult)));
    }
    return right(
      Result.ok<IEnrichedProgramBook>(await programBookMapperDTO.getFromModel(savedProgramBookResult.getValue()))
    );
  }

  private computeProgramBookStatus(programBook: ProgramBook, cmd: UpdateProgramBookCommand): ProgramBookStatus {
    if (!isEmpty(cmd.sharedRoles) && programBook.status === ProgramBookStatus.programming) {
      return ProgramBookStatus.submittedPreliminary;
    }
    if (isEmpty(cmd.sharedRoles) && programBook.status === ProgramBookStatus.submittedPreliminary) {
      return ProgramBookStatus.programming;
    }
    return cmd.status || programBook.status;
  }
}

export const updateProgramBookUseCase = new UpdateProgramBookUseCase();
