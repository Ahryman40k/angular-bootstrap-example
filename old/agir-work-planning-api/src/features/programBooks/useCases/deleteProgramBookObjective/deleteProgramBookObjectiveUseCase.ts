import { ProgramBookExpand } from '@villemontreal/agir-work-planning-lib';

import { DeleteUseCase } from '../../../../shared/domain/useCases/deleteUseCase/deleteUseCase';
import { Response } from '../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { Objective } from '../../models/objective';
import { ProgramBook } from '../../models/programBook';
import { programBookRepository } from '../../mongo/programBookRepository';
import { ProgramBookValidator } from '../../validators/programBookValidator';
import {
  DeleteProgramBookObjectiveCommand,
  IDeleteProgramBookObjectiveCommandProps
} from './deleteProgramBookObjectiveCommand';

export class DeleteProgramBookObjectiveUseCase extends DeleteUseCase<
  Objective,
  IDeleteProgramBookObjectiveCommandProps
> {
  protected createCommand(req: IDeleteProgramBookObjectiveCommandProps): Result<DeleteProgramBookObjectiveCommand> {
    return DeleteProgramBookObjectiveCommand.create(req);
  }

  public async execute(req: IDeleteProgramBookObjectiveCommandProps): Promise<Response<void>> {
    const deleteObjectiveCmdResult = this.createCommand(req);

    if (deleteObjectiveCmdResult.isFailure) {
      return left(new InvalidParameterError(deleteObjectiveCmdResult.errorValue()));
    }
    const deleteObjectiveCmd: DeleteProgramBookObjectiveCommand = deleteObjectiveCmdResult.getValue();
    const programBook: ProgramBook = await programBookRepository.findById(deleteObjectiveCmd.programBookId, [
      ProgramBookExpand.annualProgram
    ]);
    if (!programBook) {
      return left(new NotFoundError(`Could not find the program book with ID: '${deleteObjectiveCmd.programBookId}'`));
    }
    const restrictionResult = ProgramBookValidator.validateRestrictions(
      programBook.annualProgram.executorId,
      programBook.boroughIds
    );
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(restrictionResult.errorValue()));
    }
    const objective: Objective = programBook.objectives.find(o => o.id === deleteObjectiveCmd.objectiveId);
    if (!objective) {
      return left(new NotFoundError(`Could not find the objective with ID: '${deleteObjectiveCmd.objectiveId}'`));
    }

    programBook.removeObjective(objective);

    const savedUpdatedProgramBookResult = await programBookRepository.save(programBook);
    if (savedUpdatedProgramBookResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedUpdatedProgramBookResult)));
    }
    return right(Result.ok<void>());
  }
}

export const deleteProgramBookObjectiveUseCase = new DeleteProgramBookObjectiveUseCase();
