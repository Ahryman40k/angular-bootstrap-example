import { IEnrichedOpportunityNotice } from '@villemontreal/agir-work-planning-lib/dist/src';

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
  IUpdateOpportunityNoticeNoteCommandProps,
  UpdateOpportunityNoticeNoteCommand
} from './updateOpportunityNoticeNoteCommand';

export class UpdateOpportunityNoticeNoteUseCase extends UseCase<
  IUpdateOpportunityNoticeNoteCommandProps,
  IEnrichedOpportunityNotice
> {
  public async execute(req: IUpdateOpportunityNoticeNoteCommandProps): Promise<Response<IEnrichedOpportunityNotice>> {
    const [opportunityNoticeNoteCommandResult, openApiResult] = await Promise.all([
      UpdateOpportunityNoticeNoteCommand.create(req),
      OpportunityNoticeNoteValidator.validateAgainstOpenApi(req)
    ]);
    const inputValidationResult = Result.combine([opportunityNoticeNoteCommandResult, openApiResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }
    const incomingOpportunityNoticeNote: UpdateOpportunityNoticeNoteCommand = opportunityNoticeNoteCommandResult.getValue();
    const currentOpportunityNotice = await opportunityNoticeRepository.findById(
      incomingOpportunityNoticeNote.opportunityNoticeId
    );
    if (!currentOpportunityNotice) {
      return left(
        new NotFoundError(`Opportunity notice ${incomingOpportunityNoticeNote.opportunityNoticeId} was not found`)
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
    const noteIndex = currentOpportunityNotice.notes.findIndex(
      note => note.id.toString() === incomingOpportunityNoticeNote.opportunityNoticeNoteId
    );
    if (noteIndex < 0) {
      return left(
        new NotFoundError(
          `Opportunity notice note ${incomingOpportunityNoticeNote.opportunityNoticeNoteId} was not found`
        )
      );
    }

    const businessRulesResult = OpportunityNoticeNoteValidator.validateCommonBusinessRules(currentOpportunityNotice);
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const audit: Audit = Audit.fromUpdateContext(currentOpportunityNotice.notes[noteIndex].audit);
    const opportunityNoticeNoteResult = OpportunityNoticeNote.create({
      text: incomingOpportunityNoticeNote.text,
      audit
    });
    if (opportunityNoticeNoteResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(opportunityNoticeNoteResult)));
    }

    currentOpportunityNotice.notes[noteIndex] = opportunityNoticeNoteResult.getValue();
    currentOpportunityNotice.notes.sort((firstNote, secondNote) => {
      return Date.parse(firstNote.audit.lastModifiedAt || firstNote.audit.createdAt) >
        Date.parse(secondNote.audit.lastModifiedAt || secondNote.audit.createdAt)
        ? -1
        : 1;
    });

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

export const updateOpportunityNoticeNoteUseCase = new UpdateOpportunityNoticeNoteUseCase();
