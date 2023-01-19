import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { IEnrichedUserPreference, IPlainUserPreference } from '@villemontreal/agir-work-planning-lib';
import * as autobind from 'autobind-decorator';
import * as express from 'express';

import { userPreferenceSanitizer } from '../../sanitizers/userPreferenceSanitizer';
import { userService } from '../../services/userService';
import { errorMtlMapper } from '../../shared/domainErrors/errorMapperMtlApi';
import { InvalidParameterError } from '../../shared/domainErrors/invalidParameterError';
import { UnexpectedError } from '../../shared/domainErrors/unexpectedError';
import { Result } from '../../shared/logic/result';
import { createNotFoundError } from '../../utils/utils';
import { UserPreferenceFindOptions } from './models/userPreferenceFindOptions';
import { userPreferenceRepository } from './mongo/userPreferenceRepository';
import { userPreferenceService } from './userPreferenceService';
import { userPreferenceValidator } from './validators/userPreferenceValidator';

/**
 * The "@autobind" decorator automatically binds all the methods of
 * the class to the proper "this" value. When a route is executed,
 * the receiving method of the controller must be properly bound or
 * "this" will not represent the controller instance.
 * @see https://github.com/andreypopp/autobind-decorator
 */
@autobind
export class UserPreferenceController {
  public async upsertPreference(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    const user = userService.currentUser;

    const plainUserPreference: IPlainUserPreference = req.body;
    const key: string = req.params.key;

    await userPreferenceValidator.validateInputForUpsert(plainUserPreference);

    const userPreferenceFindOptionsResult = UserPreferenceFindOptions.create({
      criterias: {
        userId: user.userName,
        key
      }
    });
    if (userPreferenceFindOptionsResult.isFailure) {
      throw errorMtlMapper.toApiError(
        new InvalidParameterError(Result.combineForError(userPreferenceFindOptionsResult))
      );
    }

    let userPreference = await userPreferenceRepository.findOne(userPreferenceFindOptionsResult.getValue());
    if (!userPreference) {
      userPreference = userPreferenceService.createUserPreference(plainUserPreference, key);
    } else {
      userPreferenceService.updateUserPreference(userPreference, plainUserPreference);
    }
    const savedUserPreferenceResult = await userPreferenceRepository.save(userPreference);
    if (savedUserPreferenceResult.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(savedUserPreferenceResult)));
    }
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }

  public async getPreferences(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const user = userService.currentUser;
    const userPreferenceFindOptionsResult = UserPreferenceFindOptions.create({
      criterias: {
        userId: user.userName
      }
    });
    if (userPreferenceFindOptionsResult.isFailure) {
      throw errorMtlMapper.toApiError(
        new InvalidParameterError(Result.combineForError(userPreferenceFindOptionsResult))
      );
    }
    let userPreferences: IEnrichedUserPreference[] = await userPreferenceRepository.findAll(
      userPreferenceFindOptionsResult.getValue()
    );
    userPreferences = userPreferenceSanitizer.sanitizeArray(userPreferences);
    res.status(HttpStatusCodes.OK).send(userPreferences);
  }

  public async deletePreference(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    const user = userService.currentUser;
    const key: string = req.params.key;

    const userPreferenceFindOptionsResult = UserPreferenceFindOptions.create({
      criterias: {
        userId: user.userName,
        key
      }
    });
    if (userPreferenceFindOptionsResult.isFailure) {
      throw errorMtlMapper.toApiError(
        new InvalidParameterError(Result.combineForError(userPreferenceFindOptionsResult))
      );
    }

    const originalUserPreference = await userPreferenceRepository.findOne(userPreferenceFindOptionsResult.getValue());

    if (!originalUserPreference) {
      throw createNotFoundError('User preference not found');
    }

    await userPreferenceRepository.delete(userPreferenceFindOptionsResult.getValue());
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }
}
export const userPreferenceController: UserPreferenceController = new UserPreferenceController();
