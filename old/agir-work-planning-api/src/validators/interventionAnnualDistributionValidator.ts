import { IApiError, IInterventionAnnualDistribution } from '@villemontreal/agir-work-planning-lib/dist/src';

import { openApiInputValidator } from '../utils/openApiInputValidator';

class InterventionAnnualDistributionValidator {
  public async validateAnnualDistributionOpenApiModel(
    errorDetails: IApiError[],
    annualDistribution: IInterventionAnnualDistribution
  ): Promise<void> {
    await openApiInputValidator.validateInputModel(errorDetails, 'InterventionAnnualDistribution', annualDistribution);
  }
}

export const interventionAnnualDistributionValidator = new InterventionAnnualDistributionValidator();
