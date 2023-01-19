import { ILength } from '@villemontreal/agir-work-planning-lib';
import { Result } from '../../../shared/logic/result';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';

export class LengthValidator {
  public static async validateAgainstOpenApi(lengthInput: ILength): Promise<Result<any>> {
    return openApiInputValidator.validateOpenApiModel('Length', lengthInput);
  }
}
