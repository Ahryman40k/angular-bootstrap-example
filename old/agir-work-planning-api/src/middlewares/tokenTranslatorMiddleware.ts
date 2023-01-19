import { constants } from '@villemontreal/agir-work-planning-lib';
import { constants as jwtConstants } from '@villemontreal/core-jwt-validator-nodejs-lib';
import * as express from 'express';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as jwtLib from 'jsonwebtoken';

import { configs } from '../../config/configs';
import { tokenTranslatorFactory } from '../factories/tokenTranslatorFactory';
import { createLogger } from '../utils/logger';

const logger = createLogger('tokenTranslatorMiddleware');

/**
 * Replace Authorization header and jwt request attribute for a webToken created by tokenTranslator service
 */
export async function tokenTranslatorMiddleware(req: express.Request, next: express.NextFunction) {
  let accessToken = req.get(httpHeaderFieldsTyped.AUTHORIZATION);
  try {
    accessToken = accessToken ? accessToken.toString() : '';
    // validate if it's an real accessToken
    if (accessToken && accessToken.length === 'Bearer XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'.length) {
      accessToken = accessToken.substring(7);
    }

    // if mock mode enable the accesToken will be a ROlE, it can be a ROLE sent by Authorization header or by configuration
    // ROLE sent by configuration avoid to have always this value in request Authorization Header
    if (
      configs.security.jwt.endPoints.tokenTranslator.mock &&
      configs.security.jwt.endPoints.tokenTranslator.mockRole
    ) {
      accessToken = configs.security.jwt.endPoints.tokenTranslator.mockRole;
    }

    const jwtTemp = await tokenTranslatorFactory.service.getWebToken(
      accessToken,
      constants.GDA.APPLICATION_CODE_AGIR_PLANING
    );
    logger.debug({ result: jwtTemp }, 'WEB TOKEN TRANSALATOR RESULT ************ ');
    // Replace authrization header
    req.headers.authorization = 'Bearer ' + jwtLib.sign(JSON.stringify(jwtTemp), 'temp');
    // Replace JWT attribute in request
    req[jwtConstants.requestExtraVariables.JWT] = jwtTemp;

    next();
  } catch (error) {
    next(error);
  }
}
