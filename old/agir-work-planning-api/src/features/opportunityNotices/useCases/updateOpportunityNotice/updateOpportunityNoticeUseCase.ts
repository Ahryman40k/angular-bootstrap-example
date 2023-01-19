import { IEnrichedOpportunityNotice } from '@villemontreal/agir-work-planning-lib';
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
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { opportunityNoticeMapperDTO } from '../../mappers/opportunityNoticeMapperDTO';
import { OpportunityNotice } from '../../models/opportunityNotice';
import { OpportunityNoticeResponse } from '../../models/opportunityNoticeResponse';
import { IPlainOpportunityNoticeProps, PlainOpportunityNotice } from '../../models/plainOpportunityNotice';
import { opportunityNoticeRepository } from '../../mongo/opportunityNoticeRepository';
import { OpportunityNoticeValidator } from '../../validators/opportunityNoticeValidator';
import { IUpdateOpportunityNoticeCommandProps, UpdateOpportunityNoticeCommand } from './updateOpportunityNoticeCommand';

export class UpdateOpportunityNoticeUseCase extends UseCase<
  IUpdateOpportunityNoticeCommandProps,
  IEnrichedOpportunityNotice
> {
  // tslint:disable-next-line: cyclomatic-complexity
  public async execute(req: IUpdateOpportunityNoticeCommandProps): Promise<Response<IEnrichedOpportunityNotice>> {
    const [opportunityNoticeCommandResult, openApiResult, taxonomyResult] = await Promise.all([
      UpdateOpportunityNoticeCommand.create(req),
      OpportunityNoticeValidator.validateAgainstOpenApi(omit(req, 'id')),
      OpportunityNoticeValidator.validateTaxonomy(req)
    ]);
    const inputValidationResult = Result.combine([opportunityNoticeCommandResult, openApiResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }
    const incomingOpportunityNotice: UpdateOpportunityNoticeCommand = opportunityNoticeCommandResult.getValue();
    const currentOpportunityNotice = await opportunityNoticeRepository.findById(incomingOpportunityNotice.id);
    if (!currentOpportunityNotice) {
      return left(new NotFoundError(`Opportunity notice ${incomingOpportunityNotice.id} was not found`));
    }
    const oldProject = await projectRepository.findById(currentOpportunityNotice.projectId);

    const currentProject = await projectRepository.findById(incomingOpportunityNotice.projectId);
    if (!currentProject) {
      return left(new NotFoundError(`Project ${incomingOpportunityNotice.projectId} was not found`));
    }
    // validate restrictions
    const restrictionsResult = Result.combine([
      OpportunityNoticeValidator.validateRestrictions(currentOpportunityNotice, oldProject || {}),
      OpportunityNoticeValidator.validateRestrictions(incomingOpportunityNotice, currentProject)
    ]);
    if (restrictionsResult.isFailure) {
      return left(new ForbiddenError(restrictionsResult.errorValue()));
    }

    const opportunityNoticeResponseResult = this.getOpportunityNoticeResponseToSave(
      currentOpportunityNotice,
      incomingOpportunityNotice
    );
    if (opportunityNoticeResponseResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(opportunityNoticeResponseResult)));
    }
    const opportunityNoticeResponseToSave: OpportunityNoticeResponse = opportunityNoticeResponseResult.getValue();

    const businessRulesResult = OpportunityNoticeValidator.validateUpdateBusinessRules(
      currentOpportunityNotice,
      incomingOpportunityNotice,
      currentProject
    );
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResult)));
    }

    const opportunityNoticeCreateResult = OpportunityNotice.create(
      {
        projectId: incomingOpportunityNotice.projectId || currentOpportunityNotice.projectId,
        object: incomingOpportunityNotice.object || currentOpportunityNotice.object,
        contactInfo: incomingOpportunityNotice.contactInfo || currentOpportunityNotice.contactInfo,
        assets: incomingOpportunityNotice.assets || currentOpportunityNotice.assets,
        requestorId: incomingOpportunityNotice.requestorId || currentOpportunityNotice.requestorId,
        followUpMethod: incomingOpportunityNotice.followUpMethod || currentOpportunityNotice.followUpMethod,
        maxIterations: incomingOpportunityNotice.maxIterations || currentOpportunityNotice.maxIterations,
        notes: currentOpportunityNotice.notes,
        response: opportunityNoticeResponseToSave,
        audit: Audit.fromUpdateContext(currentOpportunityNotice.audit),
        status: OpportunityNotice.getStatusFromResponse(opportunityNoticeResponseToSave)
      },
      currentOpportunityNotice.id
    );

    if (opportunityNoticeCreateResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(opportunityNoticeCreateResult)));
    }

    const savedOpportunityNoticeResult = await opportunityNoticeRepository.save(
      opportunityNoticeCreateResult.getValue()
    );
    if (savedOpportunityNoticeResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(savedOpportunityNoticeResult)));
    }
    return right(
      Result.ok<IEnrichedOpportunityNotice>(
        await opportunityNoticeMapperDTO.getFromModel(savedOpportunityNoticeResult.getValue())
      )
    );
  }

  private getOpportunityNoticeResponseToSave(
    currentOpportunityNotice: OpportunityNotice,
    incomingOpportunityNotice: PlainOpportunityNotice<IPlainOpportunityNoticeProps>
  ): Result<OpportunityNoticeResponse> {
    if (!incomingOpportunityNotice.response) {
      return Result.ok<OpportunityNoticeResponse>(currentOpportunityNotice.response);
    }
    let responseAudit: Audit;
    if (!currentOpportunityNotice.response) {
      responseAudit = Audit.fromCreateContext();
    } else {
      responseAudit = Audit.fromUpdateContext(currentOpportunityNotice.response.audit);
    }
    return OpportunityNoticeResponse.create({
      requestorDecision: incomingOpportunityNotice.response.requestorDecision,
      requestorDecisionNote: incomingOpportunityNotice.response.requestorDecisionNote,
      requestorDecisionDate: incomingOpportunityNotice.response.requestorDecisionDate,
      planningDecision: incomingOpportunityNotice.response.planningDecision,
      planningDecisionNote: incomingOpportunityNotice.response.planningDecisionNote,
      audit: responseAudit
    });
  }
}

export const updateOpportunityNoticeUseCase = new UpdateOpportunityNoticeUseCase();
