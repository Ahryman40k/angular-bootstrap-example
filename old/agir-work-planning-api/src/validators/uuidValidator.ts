import * as mongoose from 'mongoose';

import { createInvalidParameterError } from '../utils/utils';

class UuidValidator {
  public validateParameter(str: string): void {
    if (!mongoose.Types.ObjectId.isValid(str)) {
      throw createInvalidParameterError(`The UUID is not in a valid format: '${str}'`);
    }
  }
}

export const uuidValidator = new UuidValidator();
