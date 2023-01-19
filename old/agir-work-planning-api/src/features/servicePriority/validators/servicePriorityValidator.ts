import { IServicePriority } from '@villemontreal/agir-work-planning-lib';
import { Result } from '../../../shared/logic/result';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';

export class ServicePriorityValidator {
  public static async validateAgainstOpenApi(servicePriorityInput: IServicePriority): Promise<Result<any>> {
    return openApiInputValidator.validateOpenApiModel('ServicePriority', servicePriorityInput);
  }
}
