import {
  AnnualProgramExpand,
  AnnualProgramStatus,
  IEnrichedAnnualProgram,
  Role,
  ShareableRole,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
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
import { Audit } from '../../../audit/audit';
import { taxonomyService } from '../../../taxonomies/taxonomyService';
import { annualProgramStateMachine } from '../../annualProgramStateMachine';
import { annualProgramMapperDTO } from '../../mappers/annualProgramMapperDTO';
import { AnnualProgram } from '../../models/annualProgram';
import { annualProgramRepository } from '../../mongo/annualProgramRepository';
import { AnnualProgramValidator } from '../../validators/annualProgramValidator';
import { IUpdateAnnualProgramCommandProps, UpdateAnnualProgramCommand } from './updateAnnualProgramCommand';

export class UpdateAnnualProgramUseCase extends UseCase<IUpdateAnnualProgramCommandProps, IEnrichedAnnualProgram> {
  public async execute(req: IUpdateAnnualProgramCommandProps): Promise<Response<IEnrichedAnnualProgram>> {
    const [annualProgramCmdResult, openApiResult, taxonomyResult] = await Promise.all([
      UpdateAnnualProgramCommand.create(req),
      AnnualProgramValidator.validateAgainstOpenApi(omit(req, 'id')),
      AnnualProgramValidator.validateAgainstTaxonomies(req)
    ]);

    const inputValidationResult = Result.combine([annualProgramCmdResult, openApiResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }
    const annualProgramCmd: UpdateAnnualProgramCommand = annualProgramCmdResult.getValue();

    let annualProgram = await annualProgramRepository.findById(annualProgramCmd.id, [AnnualProgramExpand.programBooks]);
    if (!annualProgram) {
      return left(new NotFoundError(`AnnualProgram with id ${annualProgramCmd.id} was not found`));
    }
    // validate old and new annualProgram
    const restrictionsResults = Result.combine([
      AnnualProgramValidator.validateRestrictions(annualProgram),
      AnnualProgramValidator.validateRestrictions(annualProgramCmd)
    ]);
    if (restrictionsResults.isFailure) {
      return left(new ForbiddenError(restrictionsResults.errorValue()));
    }

    // Set computed status onto updateCmd
    annualProgramCmd.setStatus(await this.computeAnnualProgramStatus(annualProgram, annualProgramCmd));

    const businessRulesResults = await AnnualProgramValidator.validateUpdateBusinessRules(
      annualProgramCmd,
      annualProgram
    );
    if (businessRulesResults.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResults)));
    }

    const audit: Audit = Audit.fromUpdateContext(annualProgram.audit);

    if (annualProgram.status !== annualProgramCmd.status) {
      const stateMachineResult = await annualProgramStateMachine.execute(annualProgram, annualProgramCmd.status);
      if (stateMachineResult.isFailure) {
        return left(new UnprocessableEntityError(Result.combineForError(stateMachineResult)));
      }
      annualProgram = stateMachineResult.getValue();
    }

    const annualProgramInstanciateResult = AnnualProgram.create(
      {
        executorId: annualProgramCmd.executorId,
        year: annualProgramCmd.year,
        budgetCap: annualProgramCmd.budgetCap,
        status: annualProgramCmd.status,
        description: annualProgramCmd.description,
        programBooks: annualProgram.programBooks,
        sharedRoles: annualProgram.sharedRoles,
        audit
      },
      annualProgram.id
    );

    if (annualProgramInstanciateResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(annualProgramInstanciateResult)));
    }

    const savedAnnualProgramResult = await annualProgramRepository.save(annualProgramInstanciateResult.getValue());
    if (savedAnnualProgramResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedAnnualProgramResult)));
    }
    return right(
      Result.ok<IEnrichedAnnualProgram>(await annualProgramMapperDTO.getFromModel(savedAnnualProgramResult.getValue()))
    );
  }

  private async computeAnnualProgramStatus(
    annualProgram: AnnualProgram,
    cmd: UpdateAnnualProgramCommand
  ): Promise<AnnualProgramStatus> {
    if (!isEmpty(cmd.sharedRoles)) {
      const sharedRoles = await taxonomyService.getTaxonomyValueString<Role>(
        TaxonomyGroup.shareableRole,
        ShareableRole.annualProgram
      );
      const isSharedToAll = sharedRoles.every(role => cmd.sharedRoles?.includes(role));
      if (isSharedToAll) {
        return AnnualProgramStatus.submittedFinal;
      }
    }
    return cmd.status || annualProgram.status;
  }
}

export const updateAnnualProgramUseCase = new UpdateAnnualProgramUseCase();
