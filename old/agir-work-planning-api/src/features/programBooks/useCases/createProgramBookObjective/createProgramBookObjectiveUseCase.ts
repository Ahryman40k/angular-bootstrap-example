import { IEnrichedObjective, ProgramBookExpand, ProgramBookObjectiveType } from '@villemontreal/agir-work-planning-lib';
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
  CreateProgramBookObjectiveCommand,
  ICreateProgramBookObjectiveCommandProps
} from './createProgramBookObjectiveCommand';

export class CreateProgramBookObjectiveUseCase extends UseCase<
  ICreateProgramBookObjectiveCommandProps,
  IEnrichedObjective
> {
  public async execute(req: ICreateProgramBookObjectiveCommandProps): Promise<Response<IEnrichedObjective>> {
    const [objectiveCmdResult, openApiResult, taxonomyResult] = await Promise.all([
      CreateProgramBookObjectiveCommand.create(req),
      ObjectiveValidator.validateAgainstOpenApi(omit(req, 'programBookId')),
      ObjectiveValidator.validateAgainstTaxonomies(req)
    ]);

    const inputValidationResult = Result.combine([objectiveCmdResult, openApiResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }
    const objectiveCmd: CreateProgramBookObjectiveCommand = objectiveCmdResult.getValue();
    const programBook: ProgramBook = await programBookRepository.findById(objectiveCmd.programBookId, [
      ProgramBookExpand.annualProgram
    ]);
    if (!programBook) {
      return left(new NotFoundError(`Could not find the program book with ID: '${objectiveCmd.programBookId}'`));
    }
    const restrictionResult = ProgramBookValidator.validateRestrictions(
      programBook.annualProgram.executorId,
      programBook.boroughIds
    );
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(restrictionResult.errorValue()));
    }
    const businessRulesResult = Result.combine([
      await ObjectiveValidator.validateBusinessRulesForCreate(programBook, objectiveCmd),
      ProgramBookValidator.validateIsAutomaticLoadingInProgress(programBook)
    ]);
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }
    const audit: Audit = Audit.fromCreateContext();
    const objectiveValuesResult: Result<ObjectiveValues> = ObjectiveValues.create({
      calculated: 0,
      reference: objectiveCmd.referenceValue
    });
    if (objectiveValuesResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(objectiveValuesResult)));
    }

    const objectiveCreateResult: Result<Objective> = Objective.create({
      name: objectiveCmd.name,
      targetType: objectiveCmd.targetType,
      objectiveType: objectiveCmd.objectiveType,
      pin: objectiveCmd.pin,
      assetTypeIds: objectiveCmd.assetTypeIds,
      workTypeIds: objectiveCmd.workTypeIds,
      requestorId: objectiveCmd.requestorId,
      values: objectiveValuesResult.getValue(),
      referenceValue: objectiveCmd.referenceValue, // Should not be here but as it extends plain...
      audit
    });
    if (objectiveCreateResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(objectiveCreateResult)));
    }

    const addOrReplaceObjectiveResult = await programBook.addOrReplaceObjective(objectiveCreateResult.getValue());
    if (addOrReplaceObjectiveResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(addOrReplaceObjectiveResult)));
    }

    if (objectiveCmd.objectiveType === ProgramBookObjectiveType.threshold) {
      programBook.outdatePriorityScenarios();
    }

    const savedProgramBookResult = await programBookRepository.save(programBook);
    if (savedProgramBookResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedProgramBookResult)));
    }
    return right(
      Result.ok<IEnrichedObjective>(await objectiveMapperDTO.getFromModel(objectiveCreateResult.getValue()))
    );
  }
}

export const createProgramBookObjectiveUseCase = new CreateProgramBookObjectiveUseCase();
