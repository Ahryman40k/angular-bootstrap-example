import { IApiError } from '@villemontreal/agir-work-planning-lib';
import * as fs from 'fs';
import * as jsYaml from 'js-yaml';
import { isEmpty } from 'lodash';
import * as SwaggerValidator from 'swagger-model-validator';

import { ErrorCode } from '../shared/domainErrors/errorCode';
import { Guard } from '../shared/logic/guard';
import { Result } from '../shared/logic/result';
import { createLogger } from './logger';

const logger = createLogger('openApiInputValidator');

// WARNING swagger-model-validator": "3.0.7" is working correctly(not support oneOf)
// there is a recent version (3.0.10) that support oneOf but it generates an error Maximum call stack size exceeded

const filePath = './open-api/open-api.yaml';

class OpenApiInputValidator {
  private readonly swagger: any;
  constructor() {
    this.swagger = jsYaml.safeLoad(fs.readFileSync(filePath, 'utf-8'));
    const validation = new SwaggerValidator(this.swagger);
    logger.debug(validation.id, 'constructor()');
  }

  private async validate(model: string, input: any, allowExtraProperties = false): Promise<any> {
    return this.swagger.validateModel(model, input, false, !allowExtraProperties);
  }

  /**
   * Validates input model
   * @param errorDetails
   * @param model
   * @param input
   * @param [allowExtraProperties]
   * @returns false if the input model is invalid and true if it's valid
   */
  public async validateInputModel(
    errorDetails: IApiError[],
    model: string,
    input: any,
    allowExtraProperties = false
  ): Promise<boolean> {
    logger.debug('Validate input constraint ::::::::::::::::::::');
    const validation = await this.validate(model, input, allowExtraProperties);

    if (!input || !validation.valid) {
      errorDetails.push({
        code: 'openApiInputValidator',
        message: validation.GetErrorMessages().join('; '),
        target: model
      });
      logger.debug(validation.GetErrorMessages(), 'Errors found during openApiInputValidator ::::::::::::::::::::');
      return false;
    }
    return true;
  }

  public async validateOpenApiModel(model: string, input: any, allowExtraProperties = false): Promise<Result<any>> {
    const errorDetails: IApiError[] = [];
    await openApiInputValidator.validateInputModel(errorDetails, model, input, allowExtraProperties);
    if (!isEmpty(errorDetails)) {
      return Result.combine(
        errorDetails.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCode, error.message));
        })
      );
    }
    return Result.ok();
  }
}
export const openApiInputValidator = new OpenApiInputValidator();
