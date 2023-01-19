import { getAuthorizationMiddleware, getSimplePrivilegeFilter } from '@villemontreal/access-control-api-commons-lib';
import { Permission } from '@villemontreal/agir-work-planning-lib';
import { RequestHandler } from 'express';
import * as _ from 'lodash';

import { configs } from '../../config/configs';
import { AgirRequest } from '../models/requests';
import { getSyncApplicationFromProvisioning } from '../utils/gdaUtils';
import { createForbiddenError } from '../utils/utils';

/**
 * Creates an access middleware to validate if current user has access to a route,
 * to validate the access this method receives a permission
 */
export class GdaAuthMiddlewareFactory {
  /**
   * Creates a middleware for access check based on a permission.
   * @param permission The permission required to have access.
   */
  public create(permission: Permission): RequestHandler {
    if (configs.testingMode) {
      return this.createTestingAccessMiddleware(permission);
    }
    if (configs.security.jwt.enable) {
      const filter = getSimplePrivilegeFilter<any>(getSyncApplicationFromProvisioning(), permission);
      return getAuthorizationMiddleware(filter);
    }
    return (_req, _res, next) => next();
  }

  /**
   * Creates a testing middleware to verify user accesses.
   * @param permission The permission
   */
  private createTestingAccessMiddleware(permission: Permission): RequestHandler {
    return (req: AgirRequest, _res, next) => {
      if (!req.user || !req.user.hasPermission(permission)) {
        throw createForbiddenError(
          `The user ${_.get(req.user, 'userName')} is not allowed to execute the action. Permission: ${permission}`,
          `You are not allowed to execute this action.`
        );
      }
      next();
    };
  }
}
export const gdaAuthMiddlewareFactory = new GdaAuthMiddlewareFactory();
