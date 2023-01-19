import { ErrorCodes } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { appUtils } from '../../../utils/utils';
import { NexoFileError } from '../models/nexoFileError';
import { getNexoErrorLabel, NexoErrorTarget } from './nexoErrorsLabels';

export interface INexoFileMapperErrorOptions {
  line: number;
}

class NexoFileErrorMapperDTO extends FromModelToDtoMappings<NexoFileError, string, INexoFileMapperErrorOptions> {
  public async getFromModels(
    nexoFileErrors: NexoFileError[],
    options?: INexoFileMapperErrorOptions
  ): Promise<string[]> {
    if (!nexoFileErrors) {
      return undefined;
    }
    const errorsDescriptions: string[] = [];
    // Guard errors MissingValues must be concatenated all together
    const guardMissingValuesErrors = nexoFileErrors.filter(err => err.code === ErrorCodes.MissingValue);
    if (!isEmpty(guardMissingValuesErrors)) {
      errorsDescriptions.push(await this.mergeMissingValuesErrors(guardMissingValuesErrors, options?.line));
    }
    const otherErrors = nexoFileErrors.filter(err => err.code !== ErrorCodes.MissingValue);
    return [...errorsDescriptions, ...(await Promise.all(otherErrors.map(model => this.getFromModel(model, options))))];
  }

  protected async getFromNotNullModel(nexoFileError: NexoFileError): Promise<string> {
    return this.map(nexoFileError);
  }

  private map(nexoFileError: NexoFileError): string {
    return getNexoErrorLabel(nexoFileError);
  }

  private async mergeMissingValuesErrors(errors: NexoFileError[], line: number): Promise<string> {
    const mergedError = NexoFileError.create({
      code: ErrorCodes.MissingValue,
      target: NexoErrorTarget.COLUMNS,
      values: {
        value1: errors.map(err => appUtils.capitalizeFirstLetter(err.target)).join(',')
      },
      line
    }).getValue();
    return await nexoFileErrorMapperDTO.getFromModel(mergedError);
  }
}

export const nexoFileErrorMapperDTO = new NexoFileErrorMapperDTO();
