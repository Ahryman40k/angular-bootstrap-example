import { AnnualProgramStatus, IEnrichedAnnualProgram } from '@villemontreal/agir-work-planning-lib';

import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { Audit } from '../../../audit/audit';
import { annualProgramMapperDTO } from '../../mappers/annualProgramMapperDTO';
import { AnnualProgram } from '../../models/annualProgram';
import { annualProgramRepository } from '../../mongo/annualProgramRepository';
import { AnnualProgramValidator } from '../../validators/annualProgramValidator';
import { CreateAnnualProgramCommand, ICreateAnnualProgramCommandProps } from './createAnnualProgramCommand';

export class CreateAnnualProgramUseCase extends UseCase<ICreateAnnualProgramCommandProps, IEnrichedAnnualProgram> {
  public async execute(req: ICreateAnnualProgramCommandProps): Promise<Response<IEnrichedAnnualProgram>> {
    const [annualProgramCmdResult, openApiResult, taxonomyResult] = await Promise.all([
      CreateAnnualProgramCommand.create(req),
      AnnualProgramValidator.validateAgainstOpenApi(req),
      AnnualProgramValidator.validateAgainstTaxonomies(req)
    ]);

    const inputValidationResult = Result.combine([annualProgramCmdResult, openApiResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }
    const annualProgramCmd: CreateAnnualProgramCommand = annualProgramCmdResult.getValue();
    const restrictionsResults = AnnualProgramValidator.validateRestrictions(annualProgramCmd);
    if (restrictionsResults.isFailure) {
      return left(new ForbiddenError(restrictionsResults.errorValue()));
    }
    const businessRulesResult = await AnnualProgramValidator.validateCommonBusinessRules(annualProgramCmd);
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const audit: Audit = Audit.fromCreateContext();

    const annualProgramCreateResult = AnnualProgram.create({
      executorId: annualProgramCmd.executorId,
      year: annualProgramCmd.year,
      budgetCap: annualProgramCmd.budgetCap,
      status: AnnualProgramStatus.new,
      description: annualProgramCmd.description,
      audit
    });
    if (annualProgramCreateResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(annualProgramCreateResult)));
    }
    const savedAnnualProgramResult = await annualProgramRepository.save(annualProgramCreateResult.getValue());
    if (savedAnnualProgramResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedAnnualProgramResult)));
    }
    return right(
      Result.ok<IEnrichedAnnualProgram>(await annualProgramMapperDTO.getFromModel(savedAnnualProgramResult.getValue()))
    );
  }
}

export const createAnnualProgramUseCase = new CreateAnnualProgramUseCase();
