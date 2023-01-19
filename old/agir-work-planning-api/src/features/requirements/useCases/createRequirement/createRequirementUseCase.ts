import { IRequirement } from '@villemontreal/agir-work-planning-lib';

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
import { requirementMapperDTO } from '../../mappers/requirementMapperDTO';
import { IPlainRequirementProps, PlainRequirement } from '../../models/plainRequirement';
import { Requirement } from '../../models/requirement';
import { requirementRepository } from '../../mongo/requirementRepository';
import { RequirementValidator } from '../../validators/requirementValidator';

export class CreateRequirementUseCase extends UseCase<IPlainRequirementProps, IRequirement> {
  public async execute(req: IPlainRequirementProps): Promise<Response<IRequirement>> {
    // Validate inputs
    const [plainRequirementResult, openApiResult, taxonomyResult] = await Promise.all<
      Result<PlainRequirement<IPlainRequirementProps>>,
      Result<any>,
      Result<any>
    >([
      PlainRequirement.create(req),
      RequirementValidator.validateAgainstOpenApi(req),
      RequirementValidator.validateTaxonomy(req)
    ]);

    const inputValidationResult = Result.combine([plainRequirementResult, openApiResult, taxonomyResult]);
    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(inputValidationResult.errorValue()));
    }

    const plainRequirement = plainRequirementResult.getValue();
    const requirementResult = Requirement.create({
      typeId: plainRequirement.typeId,
      subtypeId: plainRequirement.subtypeId,
      text: plainRequirement.text,
      items: plainRequirement.items,
      audit: Audit.fromCreateContext()
    });

    if (requirementResult.isFailure) {
      return left(new UnexpectedError(requirementResult.errorValue()));
    }
    const requirement = requirementResult.getValue();
    const restrictionsResults = await RequirementValidator.validateItemsRestrictions(requirement);
    if (restrictionsResults.isFailure) {
      return left(new ForbiddenError(restrictionsResults.errorValue()));
    }
    const itemResult = await RequirementValidator.validateItemsExists(requirement);
    if (itemResult.isFailure) {
      return left(new NotFoundError(itemResult.errorValue()));
    }

    const businessRulesResult = await RequirementValidator.validateCreateBusinessRules(requirement);
    if (businessRulesResult.isFailure) {
      return left(new UnprocessableEntityError(businessRulesResult.errorValue()));
    }

    const savedResult = await requirementRepository.save(requirementResult.getValue());
    if (savedResult.isFailure) {
      return left(new UnexpectedError(savedResult.errorValue()));
    }
    return right(Result.ok<IRequirement>(await requirementMapperDTO.getFromModel(savedResult.getValue())));
  }
}

export const createRequirementUseCase = new CreateRequirementUseCase();
