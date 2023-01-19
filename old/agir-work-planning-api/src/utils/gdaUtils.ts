import { Permission, Role } from '@villemontreal/agir-work-planning-lib';
import { IGluuTokenExtend } from '@villemontreal/core-gluu-authentication-nodejs-lib';
import * as _ from 'lodash';

import { configs } from '../../config/configs';
import { gdaServiceFactory } from '../factories/gdaServiceFactory';
import { gluuServiceFactory } from '../factories/gluuServiceFactory';
import { IGdaProvisioningRequestBody, IGdaProvisionRole } from '../models/gda';
import { createLogger } from './logger';

const logger = createLogger('gdaUtils');

const PROVISIONING_FILE_NAME = 'gda.provisioning.json';

/**
 * Initialize GDA configuration.
 */
export async function initGdaPermissions(): Promise<void> {
  const gluuSessionService = gluuServiceFactory.sessionService;
  const gdaService = gdaServiceFactory.service;

  // Retrieve service account token
  const provisioningJson = getGdaProvisioning();
  let serviceAccountToken: IGluuTokenExtend;
  try {
    serviceAccountToken = await gluuSessionService.getToken();
  } catch (error) {
    logger.error(error, 'initGdaPermissions: Error while retrieving service account access token');
    throw error;
  }

  // Provision GDA configuration
  try {
    await gdaService.provision(provisioningJson, serviceAccountToken.access_token);
  } catch (error) {
    logger.error(error, 'initGdaPermissions: Error while provisioning GDA permissions.');
    throw error;
  }
}

export async function getPermissionsFromProvisioning(role = Role.PLANIFICATION_ADMIN): Promise<Permission[]> {
  // get json provision
  const provisioningJson = getGdaProvisioning();
  const roles: IGdaProvisionRole[] = _.get(provisioningJson, 'roles', null);
  const roleFound = roles.find(ele => ele.code === role);
  return roleFound ? roleFound.permissions : [];
}

export function getSyncApplicationFromProvisioning(): string {
  // get json provision
  const provisioningJson = getGdaProvisioning();
  return _.get(provisioningJson, 'application.code', null);
}

export async function createMockJwt(): Promise<any> {
  return {
    displayName: 'mockAccessToken',
    userName: 'mockAccessToken',
    name: 'mockAccessToken',
    givenName: 'mockAccessToken',
    familyName: 'mockAccessToken',
    customData: []
  };
}

export function getGdaProvisioning(): IGdaProvisioningRequestBody {
  return require(`${configs.root}/provisioning/${PROVISIONING_FILE_NAME}`);
}
