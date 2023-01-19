import {
  IEnrichedOpportunityNotice,
  IPlainOpportunityNotice,
  OpportunityNoticeStatus
} from '@villemontreal/agir-work-planning-lib';
import { isEmpty } from 'lodash';

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
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { opportunityNoticeMapperDTO } from '../../mappers/opportunityNoticeMapperDTO';
import { OpportunityNoticeNote } from '../../models/notes/opportunityNoticeNote';
import { OpportunityNotice } from '../../models/opportunityNotice';
import { OpportunityNoticeFindOptions } from '../../models/opportunityNoticeFindOptions';
import { IPlainOpportunityNoticeProps, PlainOpportunityNotice } from '../../models/plainOpportunityNotice';
import { opportunityNoticeRepository } from '../../mongo/opportunityNoticeRepository';
import { OpportunityNoticeValidator } from '../../validators/opportunityNoticeValidator';

export class CreateOpportunityNoticeUseCase extends UseCase<IPlainOpportunityNotice, IEnrichedOpportunityNotice> {
  public async execute(req: IPlainOpportunityNoticeProps): Promise<Response<IEnrichedOpportunityNotice>> {
    // Validate inputs
    const [opportunityNoticeResult, openApiResult, taxonomyResult] = await Promise.all([
      PlainOpportunityNotice.create(req),
      OpportunityNoticeValidator.validateAgainstOpenApi(req),
      OpportunityNoticeValidator.validateTaxonomy(req)
    ]);

    const inputValidationResult = Result.combine([opportunityNoticeResult, openApiResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }

    const opportunityNoticeCmd: PlainOpportunityNotice<IPlainOpportunityNoticeProps> = opportunityNoticeResult.getValue();

    const project = await projectRepository.findById(opportunityNoticeCmd.projectId);
    if (!project) {
      return left(new NotFoundError(`Project ${opportunityNoticeCmd.projectId} was not found`));
    }

    const projectOpportunityNotices = await opportunityNoticeRepository.findAll(
      OpportunityNoticeFindOptions.create({
        criterias: {
          projectId: opportunityNoticeCmd.projectId
        }
      }).getValue()
    );
    // Asset should be a domain class instance
    const assets = opportunityNoticeCmd.assets;
    const businessRulesResult = OpportunityNoticeValidator.validateCreateBusinessRules(
      project,
      projectOpportunityNotices,
      assets
    );
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const audit: Audit = Audit.fromCreateContext();
    let notes: OpportunityNoticeNote[];
    if (!isEmpty(opportunityNoticeCmd.notes)) {
      const notesResult = opportunityNoticeCmd.notes.map(plainNote => {
        return OpportunityNoticeNote.create({
          ...plainNote.props,
          audit
        });
      });
      if (notesResult.find(result => result.isFailure)) {
        return left(new UnexpectedError(Result.combineForError(Result.combine(notesResult))));
      }
      notes = notesResult.map(result => result.getValue());
    }

    // In case of create, uuid is generated by Entity class
    const opportunityNoticeCreateResult = OpportunityNotice.create({
      projectId: opportunityNoticeCmd.projectId,
      object: opportunityNoticeCmd.object,
      assets: opportunityNoticeCmd.assets,
      requestorId: opportunityNoticeCmd.requestorId,
      followUpMethod: opportunityNoticeCmd.followUpMethod,
      maxIterations: opportunityNoticeCmd.maxIterations,
      notes,
      audit,
      status: OpportunityNoticeStatus.new
    });

    if (opportunityNoticeCreateResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(opportunityNoticeCreateResult)));
    }
    const restrictionsResult = OpportunityNoticeValidator.validateRestrictions(
      opportunityNoticeCreateResult.getValue(),
      project
    );
    if (restrictionsResult.isFailure) {
      return left(new ForbiddenError(restrictionsResult.errorValue()));
    }

    const savedOpportunityNoticeResult = await opportunityNoticeRepository.save(
      opportunityNoticeCreateResult.getValue()
    );
    if (savedOpportunityNoticeResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedOpportunityNoticeResult)));
    }

    project.isOpportunityAnalysis = true;
    const savedProjectResult = await projectRepository.save(project);
    if (savedProjectResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedProjectResult)));
    }
    return right(
      Result.ok<IEnrichedOpportunityNotice>(
        await opportunityNoticeMapperDTO.getFromModel(savedOpportunityNoticeResult.getValue())
      )
    );
  }
}

export const createOpportunityNoticeUseCase = new CreateOpportunityNoticeUseCase();
