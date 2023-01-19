import { IApiError } from '@villemontreal/agir-work-planning-lib/dist/src';
import { IErrorDictionary } from './error.service';

export class ErrorHandlerService {
  protected getMessageFromCode(e: IApiError, errorCodes: IErrorDictionary[]) {
    const error = errorCodes.find(el => {
      if (el.key !== '') {
        return el.code === e.target && el.key === e.code;
      }
      return el.code === e.target;
    });
    return error ? error.value(null) : 'Une erreur est survenue';
  }
}
