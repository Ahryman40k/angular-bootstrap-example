import { AnnualProgramStatus, IEnrichedProgramBook, ProgramBookStatus } from '@villemontreal/agir-work-planning-lib';
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
import { annualProgramStateMachine } from '../../../annualPrograms/annualProgramStateMachine';
import { annualProgramRepository } from '../../../annualPrograms/mongo/annualProgramRepository';
import { Audit } from '../../../audit/audit';
import { PriorityScenario } from '../../../priorityScenarios/models/priorityScenario';
import { programBookMapperDTO } from '../../mappers/programBookMapperDTO';
import { ProgramBook } from '../../models/programBook';
import { programBookRepository } from '../../mongo/programBookRepository';
import { ProgramBookValidator } from '../../validators/programBookValidator';
import { CreateProgramBookCommand, ICreateProgramBookCommandProps } from './createProgramBookCommand';

export class CreateProgramBookUseCase extends UseCase<ICreateProgramBookCommandProps, IEnrichedProgramBook> {
  public async execute(req: ICreateProgramBookCommandProps): Promise<Response<IEnrichedProgramBook>> {
    const [programBookCmdResult, openApiResult, taxonomyResult] = await Promise.all([
      CreateProgramBookCommand.create(req),
      ProgramBookValidator.validateAgainstOpenApi(omit(req, 'annualProgramId')),
      ProgramBookValidator.validateAgainstTaxonomies(req)
    ]);

    const inputValidationResult = Result.combine([programBookCmdResult, openApiResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }
    const programBookCmd: CreateProgramBookCommand = programBookCmdResult.getValue();

    const existingAnnualProgram = await annualProgramRepository.findById(programBookCmd.annualProgramId);
    if (!existingAnnualProgram) {
      return left(new NotFoundError(`Annual Program with id ${programBookCmd.annualProgramId} was not found`));
    }
    const restrictionResult = ProgramBookValidator.validateRestrictions(
      existingAnnualProgram.executorId,
      programBookCmd.boroughIds
    );
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(restrictionResult.errorValue()));
    }

    const businessRulesResult = await ProgramBookValidator.validateCommonBusinessRules(
      existingAnnualProgram,
      programBookCmdResult.getValue()
    );
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const audit: Audit = Audit.fromCreateContext();

    const updateAnnualProgramStatus = await annualProgramStateMachine.execute(
      existingAnnualProgram,
      AnnualProgramStatus.programming
    );
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(updateAnnualProgramStatus)));
    }

    const programBookCreateResult = ProgramBook.create({
      boroughIds: programBookCmd.boroughIds,
      inCharge: programBookCmd.inCharge,
      name: programBookCmd.name,
      projectTypes: programBookCmd.projectTypes,
      status: ProgramBookStatus.new,
      annualProgram: existingAnnualProgram,
      objectives: [], // TODO
      projects: undefined, // TODO
      removedProjects: undefined, // TODO
      priorityScenarios: [PriorityScenario.getDefault()],
      programTypes: programBookCmd.programTypes,
      description: programBookCmd.description,
      isAutomaticLoadingInProgress: false,
      audit
    });
    if (programBookCreateResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(programBookCreateResult)));
    }
    const savedProgramBookResult = await programBookRepository.save(programBookCreateResult.getValue());
    if (savedProgramBookResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedProgramBookResult)));
    }
    return right(
      Result.ok<IEnrichedProgramBook>(await programBookMapperDTO.getFromModel(savedProgramBookResult.getValue()))
    );
  }
}

export const createProgramBookUseCase = new CreateProgramBookUseCase();
