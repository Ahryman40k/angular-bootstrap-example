import { IRequirement } from '@villemontreal/agir-work-planning-lib';
import { isEqual } from 'lodash';

import { IUseCase } from '../../../../shared/domain/iUseCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { Either } from '../../../../shared/logic/either';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { Audit } from '../../../audit/audit';
import { requirementMapperDTO } from '../../mappers/requirementMapperDTO';
import { IPlainRequirementProps } from '../../models/plainRequirement';
import { Requirement } from '../../models/requirement';
import { requirementRepository } from '../../mongo/requirementRepository';
import { RequirementValidator } from '../../validators/requirementValidator';
import { IUpdateRequirementCommandProps, UpdateRequirementCommand } from './updateRequirementCommand';

type Response = Either<InvalidParameterError | UnexpectedError | NotFoundError, Result<IRequirement>>;

export class UpdateRequirementUseCase implements IUseCase<IPlainRequirementProps, Response> {
  public async execute(req: IUpdateRequirementCommandProps): Promise<Response> {
    // Validate inputs
    const [updateRequirementCmdResult, openApiResult, taxonomyResult] = await Promise.all([
      UpdateRequirementCommand.create(req),
      RequirementValidator.validateAgainstOpenApi(req),
      RequirementValidator.validateTaxonomy(req)
    ]);

    const inputValidationResult = Result.combine([updateRequirementCmdResult, openApiResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }
    const requirementCmd: UpdateRequirementCommand = updateRequirementCmdResult.getValue();
    const currentRequirement = await requirementRepository.findById(requirementCmd.id);
    if (!currentRequirement) {
      return left(new NotFoundError(`Requirement ${requirementCmd.id} was not found`));
    }
    // validate restriction for old Items
    let restrictionsResults = await RequirementValidator.validateItemsRestrictions(currentRequirement);
    if (restrictionsResults.isFailure) {
      return left(new ForbiddenError(restrictionsResults.errorValue()));
    }

    const requirementUpdateResult = Requirement.create(
      {
        typeId: requirementCmd.typeId,
        subtypeId: requirementCmd.subtypeId,
        text: requirementCmd.text,
        items: requirementCmd.items,
        audit: Audit.fromUpdateContext(currentRequirement.audit)
      },
      requirementCmd.id
    );

    if (requirementUpdateResult.isFailure) {
      return left(new UnexpectedError(requirementUpdateResult.errorValue()));
    }
    const requirement = requirementUpdateResult.getValue();

    // validate restriction for new Items
    if (!isEqual(requirement.items, currentRequirement.items)) {
      restrictionsResults = await RequirementValidator.validateItemsRestrictions(requirement);
      if (restrictionsResults.isFailure) {
        return left(new ForbiddenError(restrictionsResults.errorValue()));
      }
    }

    const itemResult = await RequirementValidator.validateItemsExists(requirement);
    if (itemResult.isFailure) {
      return left(new NotFoundError(itemResult.errorValue()));
    }

    const businessRulesResult = await RequirementValidator.validateUpdateBusinessRules(requirement);
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(businessRulesResult.errorValue()));
    }

    const savedResult = await requirementRepository.save(requirementUpdateResult.getValue());
    if (savedResult.isFailure) {
      return left(new UnexpectedError(savedResult.errorValue()));
    }
    return right(Result.ok<IRequirement>(await requirementMapperDTO.getFromModel(savedResult.getValue())));
  }
}

export const updateRequirementUseCase = new UpdateRequirementUseCase();
