import * as autobind from 'autobind-decorator';
import * as express from 'express';
import * as HttpStatusCodes from 'http-status-codes';

import { AlreadyExistsError } from './domainErrors/alreadyExistsError';
import { ConflictError } from './domainErrors/conflictError';
import { errorMtlMapper } from './domainErrors/errorMapperMtlApi';
import { ForbiddenError } from './domainErrors/forbiddenError';
import { IApiErrorMapper } from './domainErrors/iApiErrorMapper';
import { InvalidParameterError } from './domainErrors/invalidParameterError';
import { NetworkRequestError } from './domainErrors/networkRequestError';
import { NotFoundError } from './domainErrors/notFoundError';
import { StateTransitionError } from './domainErrors/StateTransitionError';
import { UnexpectedError } from './domainErrors/unexpectedError';
import { UnprocessableEntityError } from './domainErrors/unprocessableEntityError';

@autobind
export abstract class BaseController {
  // Could be injected
  private readonly apiErrorMapper: IApiErrorMapper<any> = errorMtlMapper;

  public abstract execute(req: express.Request, res: express.Response): Promise<void>;

  public ok<T>(res: express.Response, dto?: T) {
    if (dto) {
      return res.status(HttpStatusCodes.OK).send(dto);
    }
    return res.sendStatus(HttpStatusCodes.OK);
  }

  public fail(error: UnexpectedError) {
    return this.apiErrorMapper.toApiError(error);
  }

  public accepted<T>(res: express.Response) {
    return res.sendStatus(HttpStatusCodes.ACCEPTED);
  }

  public created<T>(res: express.Response, dto?: T) {
    if (dto) {
      return res.status(HttpStatusCodes.CREATED).send(dto);
    }
    return res.sendStatus(HttpStatusCodes.CREATED);
  }

  public done<T>(res: express.Response) {
    return res.sendStatus(HttpStatusCodes.NO_CONTENT);
  }

  public clientError(error: InvalidParameterError) {
    return this.apiErrorMapper.toApiError(error);
  }

  public networkRequestError(error: NetworkRequestError) {
    return this.apiErrorMapper.toApiError(error);
  }

  public unauthorized(error: ForbiddenError) {
    return this.apiErrorMapper.toApiError(error);
  }

  public notFound(error: NotFoundError) {
    return this.apiErrorMapper.toApiError(error);
  }

  public unprocessable(error: UnprocessableEntityError) {
    return this.apiErrorMapper.toApiError(error);
  }

  public transitionError(error: UnprocessableEntityError) {
    return this.apiErrorMapper.toApiError(error);
  }

  public conflict(error: AlreadyExistsError | ConflictError) {
    return this.apiErrorMapper.toApiError(error);
  }

  protected alreadyExistsError(error: any): error is AlreadyExistsError {
    return error.constructor && error.constructor === AlreadyExistsError;
  }

  protected isInvalidParameterError(error: any): error is InvalidParameterError {
    return error.constructor && error.constructor === InvalidParameterError;
  }

  protected isUnexpectedError(error: any): error is UnexpectedError {
    return error.constructor && error.constructor === UnexpectedError;
  }

  protected isNotFoundError(error: any): error is NotFoundError {
    return error.constructor && error.constructor === NotFoundError;
  }

  protected isForbiddenError(error: any): error is ForbiddenError {
    return error.constructor && error.constructor === ForbiddenError;
  }

  protected isUnprocessableEntityError(error: any): error is UnprocessableEntityError {
    return error.constructor && error.constructor === UnprocessableEntityError;
  }

  protected isStateTransitionError(error: any): error is StateTransitionError {
    return error.constructor && error.constructor === StateTransitionError;
  }

  protected isNetworkRequestError(error: any): error is NetworkRequestError {
    return error.constructor && error.constructor === NetworkRequestError;
  }

  protected isAlreadyExistsError(error: any): error is AlreadyExistsError {
    return error.constructor && error.constructor === AlreadyExistsError;
  }

  protected mapToApiError(
    error: InvalidParameterError | ForbiddenError | NotFoundError | UnprocessableEntityError | UnexpectedError
  ): void {
    if (this.isUnexpectedError(error)) {
      throw this.fail(error);
    } else if (this.isInvalidParameterError(error)) {
      throw this.clientError(error);
    } else if (this.isNotFoundError(error)) {
      throw this.notFound(error);
    } else if (this.isUnprocessableEntityError(error)) {
      throw this.unprocessable(error);
    } else if (this.isForbiddenError(error)) {
      throw this.unauthorized(error);
    } else if (this.alreadyExistsError(error)) {
      throw this.conflict(error);
    } else {
      throw new Error('Received a valid result on the left side');
    }
  }
}
