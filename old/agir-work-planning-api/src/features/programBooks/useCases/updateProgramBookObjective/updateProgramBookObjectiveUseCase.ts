import { ProgramBookExpand } from '@villemontreal/agir-work-planning-lib';
import { IEnrichedObjective, ProgramBookObjectiveType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { omit } from 'lodash';

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
import { objectiveMapperDTO } from '../../mappers/objectiveMapperDTO';
import { Objective } from '../../models/objective';
import { ObjectiveValues } from '../../models/objectiveValues';
import { ProgramBook } from '../../models/programBook';
import { programBookRepository } from '../../mongo/programBookRepository';
import { ObjectiveValidator } from '../../validators/objectiveValidator';
import { ProgramBookValidator } from '../../validators/programBookValidator';
import {
  IUpdateProgramBookObjectiveCommandProps,
  UpdateProgramBookObjectiveCommand
} from './updateProgramBookObjectiveCommand';

// tslint:disable:cyclomatic-complexity
export class UpdateProgramBookObjectiveUseCase extends UseCase<
  IUpdateProgramBookObjectiveCommandProps,
  IEnrichedObjective
> {
  public async execute(req: IUpdateProgramBookObjectiveCommandProps): Promise<Response<IEnrichedObjective>> {
    const [updateObjectiveCmdResult, openApiResult, taxonomyResult] = await Promise.all([
      UpdateProgramBookObjectiveCommand.create(req),
      ObjectiveValidator.validateAgainstOpenApi(omit(req, ['programBookId', 'objectiveId'])),
      ObjectiveValidator.validateAgainstTaxonomies(req)
    ]);
    const inputValidationResult = Result.combine([updateObjectiveCmdResult, openApiResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }

    const updateObjectiveCmd: UpdateProgramBookObjectiveCommand = updateObjectiveCmdResult.getValue();
    const programBook: ProgramBook = await programBookRepository.findById(updateObjectiveCmd.programBookId, [
      ProgramBookExpand.annualProgram
    ]);
    if (!programBook) {
      return left(new NotFoundError(`Could not find the program book with ID: '${updateObjectiveCmd.programBookId}'`));
    }
    const restrictionResult = ProgramBookValidator.validateRestrictions(
      programBook.annualProgram.executorId,
      programBook.boroughIds
    );
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(restrictionResult.errorValue()));
    }
    const objective: Objective = programBook.objectives.find(o => o.id === updateObjectiveCmd.objectiveId);
    if (!objective) {
      return left(new NotFoundError(`Could not find the objective with ID: '${updateObjectiveCmd.objectiveId}'`));
    }

    const businessRulesResult = Result.combine([
      await ObjectiveValidator.validateBusinessRulesForUpdate(programBook, updateObjectiveCmd),
      ProgramBookValidator.validateIsAutomaticLoadingInProgress(programBook)
    ]);
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const objectiveValuesResult = ObjectiveValues.create({
      calculated: objective.values.calculated || 0,
      reference: updateObjectiveCmd.referenceValue
    });
    if (objectiveValuesResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(objectiveValuesResult)));
    }
    const updatedObjectiveInstanceResult = Objective.create(
      {
        name: updateObjectiveCmd.name,
        targetType: updateObjectiveCmd.targetType,
        objectiveType: updateObjectiveCmd.objectiveType,
        requestorId: updateObjectiveCmd.requestorId,
        assetTypeIds: updateObjectiveCmd.assetTypeIds,
        workTypeIds: updateObjectiveCmd.workTypeIds,
        values: objectiveValuesResult.getValue(),
        pin: updateObjectiveCmd.pin,
        referenceValue: updateObjectiveCmd.referenceValue,
        audit: Audit.fromUpdateContext(objective.audit)
      },
      objective.id
    );
    if (updatedObjectiveInstanceResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(updatedObjectiveInstanceResult)));
    }
    const addOrReplaceObjectiveResult = await programBook.addOrReplaceObjective(
      updatedObjectiveInstanceResult.getValue()
    );
    if (addOrReplaceObjectiveResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(addOrReplaceObjectiveResult)));
    }

    if (updateObjectiveCmd.objectiveType === ProgramBookObjectiveType.threshold) {
      programBook.outdatePriorityScenarios();
    }

    const savedUpdatedProgramBookResult = await programBookRepository.save(programBook);
    if (savedUpdatedProgramBookResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedUpdatedProgramBookResult)));
    }
    return right(
      Result.ok<IEnrichedObjective>(await objectiveMapperDTO.getFromModel(updatedObjectiveInstanceResult.getValue()))
    );
  }
}

export const updateProgramBookObjectiveUseCase = new UpdateProgramBookObjectiveUseCase();
