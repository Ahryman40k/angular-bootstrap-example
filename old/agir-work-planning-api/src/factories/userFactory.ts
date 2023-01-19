import { IUser, User } from '@villemontreal/agir-work-planning-lib';
import { constants as jwtConstants } from '@villemontreal/core-jwt-validator-nodejs-lib';
import * as express from 'express';

export class UserFactory {
  /**
   * Creates the user from the express request.
   * Retrieves the JWT from the request and creates the user from it.
   * @param request The express request
   */
  public create(request: express.Request): User {
    const jwt = request[jwtConstants.requestExtraVariables.JWT] as IUser;
    return jwt ? new User(jwt) : null;
  }
}
export const userFactory = new UserFactory();
