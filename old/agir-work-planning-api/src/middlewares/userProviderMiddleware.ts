import { User } from '@villemontreal/agir-work-planning-lib';
import * as express from 'express';

import { configs } from '../../config/configs';
import { userMocker } from '../../tests/utils/userUtils';
import { userFactory } from '../factories/userFactory';
import { AgirRequest } from '../models/requests';
import { userService } from '../services/userService';

/**
 * Provides the current authenticated user to the request object.
 */
export function userProviderMiddleware(
  request: express.Request,
  _response: express.Response,
  next: express.NextFunction
): void {
  let user: User;
  if (configs.testingMode || configs.gluu.mock) {
    user = new User(userMocker.currentMock);
  } else {
    user = userFactory.create(request);
  }
  (request as AgirRequest).user = user;
  userService.withUser(next, user);
}
