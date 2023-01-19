import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import * as request from 'request';

import { REPLACE_FLAG } from './constants';
import { IEnvironmentConfig } from './environment-config';

// tslint:disable: no-console

const AUTHORIZATION_HEADER = 'Authorization';
const AUTHORIZATION_HEADER_BEARER = 'Bearer ';

/**
 * Retrieves the JSON data of the source layer depending on the environment.
 * @param environmentConfig The environment definition
 * @param sourceLayerId The source layer ID
 */
export function getSourceLayerJson(sourceLayerId: string, environmentConfig: IEnvironmentConfig): Promise<any> {
  const url = environmentConfig.url.replace(REPLACE_FLAG, sourceLayerId);

  const headers = {};
  if (environmentConfig.token) {
    headers[AUTHORIZATION_HEADER] = AUTHORIZATION_HEADER_BEARER + environmentConfig.token;
  }

  return new Promise((resolve, reject) => {
    request(url, { json: true, headers }, (err, res) => {
      if (err) {
        reject(err);
        return;
      }
      if (res.statusCode !== HttpStatusCodes.OK) {
        console.error(res.body); // NOSONAR
        reject(res.body);
        return;
      }
      delete res.body.tiles; // Remove the "tiles" property because it can change between environments.
      resolve(res.body);
    });
  });
}
