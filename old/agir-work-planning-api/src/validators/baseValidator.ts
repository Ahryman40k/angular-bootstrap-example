import { ErrorCodes, IApiError } from '@villemontreal/agir-work-planning-lib';

import { CustomModel } from '../repositories/mongo/customModel';
import { createLogger } from '../utils/logger';
import { openApiInputValidator } from '../utils/openApiInputValidator';
import { appUtils } from '../utils/utils';

const logger = createLogger('Validator');

export abstract class BaseValidator<T> {
  protected abstract get model(): CustomModel<any>;

  protected abstract getOpenApiModelName(t: T): string;

  protected async validateOpenApiModel(errorDetails: IApiError[], object: T): Promise<void> {
    logger.debug('Validate open api model ::::::::::::::::::::');
    const myObject = appUtils.convertDateToISOString<T>(object);
    await openApiInputValidator.validateInputModel(errorDetails, this.getOpenApiModelName(myObject), myObject);
  }

  protected validateKeyOf(errors: IApiError[], key: string) {
    const paths: string[] = [];
    this.model.schema.eachPath(p => paths.push(p));
    if (!paths.includes(key)) {
      errors.push({
        code: ErrorCodes.InvalidInput,
        message: `Invalid key: "${key}". Possible values are: ${paths.join(', ')}`
      });
    }
  }
}
