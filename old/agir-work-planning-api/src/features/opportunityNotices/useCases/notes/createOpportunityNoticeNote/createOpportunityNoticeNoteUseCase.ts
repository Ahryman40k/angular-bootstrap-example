import { IEnrichedOpportunityNotice, IPlainNote } from '@villemontreal/agir-work-planning-lib';

import { Response, UseCase } from '../../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../../shared/logic/left';
import { Result } from '../../../../../shared/logic/result';
import { right } from '../../../../../shared/logic/right';
import { Audit } from '../../../../audit/audit';
import { projectRepository } from '../../../../projects/mongo/projectRepository';
import { opportunityNoticeMapperDTO } from '../../../mappers/opportunityNoticeMapperDTO';
import { OpportunityNoticeNote } from '../../../models/notes/opportunityNoticeNote';
import { opportunityNoticeRepository } from '../../../mongo/opportunityNoticeRepository';
import { OpportunityNoticeNoteValidator } from '../../../validators/notes/opportunityNoticeNoteValidator';
import { OpportunityNoticeValidator } from '../../../validators/opportunityNoticeValidator';
import {
  CreateOpportunityNoticeNoteCommand,
  ICreateOpportunityNoticeNoteCommandProps
} from './createOpportunityNoticeNoteCommand';

export class CreateOpportunityNoticeNoteUseCase extends UseCase<IPlainNote, IEnrichedOpportunityNotice> {
  public async execute(req: ICreateOpportunityNoticeNoteCommandProps): Promise<Response<IEnrichedOpportunityNotice>> {
    const [opportunityNoticeNoteCommandResult, openApiResult] = await Promise.all([
      CreateOpportunityNoticeNoteCommand.create(req),
      OpportunityNoticeNoteValidator.validateAgainstOpenApi(req)
    ]);
    const inputValidationResult = Result.combine([opportunityNoticeNoteCommandResult, openApiResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }

    const opportunityNoticeNoteCommand: CreateOpportunityNoticeNoteCommand = opportunityNoticeNoteCommandResult.getValue();
    const currentOpportunityNotice = await opportunityNoticeRepository.findById(
      opportunityNoticeNoteCommand.opportunityNoticeId
    );
    if (!currentOpportunityNotice) {
      return left(
        new NotFoundError(`Opportunity notice ${opportunityNoticeNoteCommand.opportunityNoticeId} was not found`)
      );
    }
    const currentProject = await projectRepository.findById(currentOpportunityNotice.projectId);
    if (!currentProject) {
      return left(new NotFoundError(`Project ${currentOpportunityNotice.projectId} was not found`));
    }
    // validate restrictions
    const restrictionsResult = OpportunityNoticeValidator.validateRestrictions(
      currentOpportunityNotice,
      currentProject
    );
    if (restrictionsResult.isFailure) {
      return left(new ForbiddenError(restrictionsResult.errorValue()));
    }

    const businessRulesResult = OpportunityNoticeNoteValidator.validateCommonBusinessRules(currentOpportunityNotice);
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const audit: Audit = Audit.fromCreateContext();
    // On ne veut jamais accéder aux props puisque rien dit qu'elles sont effectivement valides
    // c'est pour qu'on passe seulement par les getters
    const opportunityNoticeNoteResult = OpportunityNoticeNote.create({
      text: opportunityNoticeNoteCommand.text,
      audit
    });
    if (opportunityNoticeNoteResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(opportunityNoticeNoteResult)));
    }

    currentOpportunityNotice.notes.unshift(opportunityNoticeNoteResult.getValue());

    const savedOpportunityNoticeResult = await opportunityNoticeRepository.save(currentOpportunityNotice);
    if (savedOpportunityNoticeResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedOpportunityNoticeResult)));
    }
    return right(
      Result.ok<IEnrichedOpportunityNotice>(
        await opportunityNoticeMapperDTO.getFromModel(savedOpportunityNoticeResult.getValue())
      )
    );
  }
}

export const createOpportunityNoticeNoteUseCase = new CreateOpportunityNoticeNoteUseCase();
