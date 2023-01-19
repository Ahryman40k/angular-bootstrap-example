import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib';
import { httpUtils } from '@villemontreal/core-http-request-nodejs-lib';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import superagent = require('superagent');

import { configs } from '../../config/configs';
import { constants } from '../../config/constants';
import { IGdaPrivileges, IGdaProvisioningRequestBody, IGdaProvisioningResponseBody } from '../models/gda';
import { createLogger } from '../utils/logger';

const logger = createLogger('gdaServiceImpl');

export interface IGdaService {
  /**
   * Send all roles/permissions/ assignement for this application to
   * Access Control Management API
   * The information can come for a provisioning json file
   */
  provision(provision: IGdaProvisioningRequestBody, accessToken: string): Promise<IGdaProvisioningResponseBody>;
  /**
   * get privileges from accessToken for an applicationCode
   * @param accessToken
   * @param applicationCode
   */
  getPrivileges(accessToken: string, applicationCode: string): Promise<IGdaPrivileges[]>;
}

export class GdaService implements IGdaService {
  public async provision(
    provision: IGdaProvisioningRequestBody,
    accessToken: string
  ): Promise<IGdaProvisioningResponseBody> {
    logger.info('Preparing request to gda');

    const urlProvisioning = configs.gda.urls.provision;
    const request = superagent.post(urlProvisioning);

    // Only opened to service account
    request
      .send(provision)
      .set('Authorization', `${constants.httpHeadersValues.BEARER}${accessToken}`)
      .set('Content-Type', constants.mediaTypes.JSON)
      .set('cache-control', 'no-cache');

    logger.debug(JSON.stringify(request), '[provision] request');

    return httpUtils
      .send(request)
      .then(async (response: superagent.Response) => {
        logger.debug(JSON.stringify(response), '[provision] response');
        if (!response.ok) {
          const error = {
            body: response.body,
            message: response.error.message,
            text: response.error.text,
            status: response.error.status
          };
          logger.error(error, 'Provisioning failed');
          throw new Error(JSON.stringify(error));
        }
        logger.debug('Provisioning succeeded');
        return Promise.resolve(response.body);
      })
      .catch((error: any) => {
        logger.error(error, 'Provisioning failed');
        return Promise.reject(error);
      });
  }

  public async getPrivileges(accessToken: string, applicationCode = ''): Promise<IGdaPrivileges[]> {
    let url = `${configs.gda.urls.privileges}` + `?fields[]=permissions`;
    if (applicationCode !== '') {
      url = url + `&applicationCode=${applicationCode}`;
    }
    const request = superagent.get(url);
    request.set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr');
    request.set(httpHeaderFieldsTyped.CONTENT_TYPE, constants.mediaTypes.JSON);
    request.set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON);
    request.set('cache-control', 'no-cache');

    request.set(httpHeaderFieldsTyped.AUTHORIZATION, `${constants.httpHeadersValues.BEARER}${accessToken}`);

    logger.debug(JSON.stringify(request), '[setRegularAuthorizationHeaders] request');

    let privileges: IGdaPrivileges[] = [];
    const response = await httpUtils.send(request);

    if (response.ok) {
      privileges = response.body;
    } else if (response.status === HttpStatusCodes.FORBIDDEN) {
      logger.warning(`Forbidden on GDA (403). There will be no privileges: ${JSON.stringify(response.body)}`);
    } else {
      throw new Error('Bad response getPrivileges');
    }

    if (privileges && privileges.length === 0) {
      logger.warning('An empty privileges object was received by the GDA API');
    }
    return privileges;
  }
}
