import { httpUtils } from '@villemontreal/core-http-request-nodejs-lib';
import { IJWTPayload } from '@villemontreal/core-jwt-validator-nodejs-lib';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as _ from 'lodash';
import superagent = require('superagent');

import { configs } from '../../config/configs';

export interface ITokenTranslatorService {
  getWebToken(accessToken: string, applicationCode?: string): Promise<IJWTPayload>;
}

export class TokenTranslatorService implements ITokenTranslatorService {
  public async getWebToken(accessToken = '', applicationCode?: string): Promise<IJWTPayload> {
    const url = `${configs.security.jwt.host}${configs.security.jwt.endPoints.tokenTranslator.url}`;
    try {
      const request = superagent.post(url);
      const body = {
        accessToken
      };
      // add extension gestions des access to add customData to JWT
      if (applicationCode) {
        const gdaUrl = `${configs.gda.urls.privileges}`;
        _.set(body, 'extensions', this.getGdaExtension(gdaUrl, applicationCode));
      }
      request.send(body);
      request.set(httpHeaderFieldsTyped.AUTHORIZATION, 'Bearer ' + accessToken);
      const result = await httpUtils.send(request);
      if (!result.ok) {
        return Promise.reject(new Error(`An error occured calling ${url} : ${result.error}`));
      }
      if (result.body && result.body.jwts && result.body.jwts.expanded) {
        return Promise.resolve(result.body.jwts.expanded as IJWTPayload);
      }
      return Promise.reject(new Error(`No jwts.expanded found in body response :  ${result.body}`));
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private getGdaExtension(url: string, application: string): any {
    return {
      jwt: {
        customDataProvider: {
          uri: url,
          method: 'POST',
          options: { fields: ['permissions'], application }
        }
      }
    };
  }
}
