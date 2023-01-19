// ==========================================
// Initialization
// ==========================================
import { correlationIdService, init as initCidUtils } from '@villemontreal/core-correlation-id-nodejs-lib';
import { init as initGluu, IOpenIdClient, IServiceAccount } from '@villemontreal/core-gluu-authentication-nodejs-lib';
import { init as initHttpUtils } from '@villemontreal/core-http-request-nodejs-lib';
import { init as initJwtValidationLib } from '@villemontreal/core-jwt-validator-nodejs-lib';
import { init as initGeoUtils } from '@villemontreal/core-utils-geo-nodejs-lib';
import { init as initKnexUtilsLib } from '@villemontreal/core-utils-knex-nodejs-lib';
import { configs } from '../config/configs';
import { initDatabase } from './features/database/DB';
import { initGdaPermissions } from './utils/gdaUtils';
import { createLogger } from './utils/logger';

/**
 * Initialization to be performed *before*
 * the application is actually started.
 *
 * This function will be called automatically
 * when error management is in place, but before
 * the HTTP server is started.
 *
 * It is the place to initialize connection pools,
 * prepare some resources, etc.
 *
 * NOTE : all actions in this function must be
 * awaited!! When the function exits, the application
 * will be considered as 100% ready.
 */
export async function initComponents() {
  // ==========================================
  // It is important to pass a "Logger Creator"
  // to all our custom libraries, so we can
  // control how their logs are actually performed
  // and make sure the correct Correlation Ids are
  // used...
  // Some libraries may require other parameters too.
  // ==========================================

  // ==========================================
  // Initializes TLS Rejection
  // ==========================================
  if (configs.tls.reject) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  // ==========================================
  // Initializes the Http Utilities library.
  // ==========================================
  initHttpUtils(createLogger, () => {
    return correlationIdService.getId();
  });

  // ==========================================
  // Initializes the Correlation Ids library.
  // ==========================================
  initCidUtils(createLogger);

  // ==========================================
  // Initializes Gluu.
  // ==========================================
  initGluu(
    createLogger,
    () => {
      return correlationIdService.getId();
    },

    // Set the host of Gluu
    configs.gluu.urlToken, // configs.gluu.url,
    {
      username: configs.gluu.openIdClient.username,
      password: configs.gluu.openIdClient.password
    } as IOpenIdClient,

    {
      scope: configs.gluu.serviceAccount.scope,
      username: configs.gluu.serviceAccount.username,
      password: configs.gluu.serviceAccount.password
    } as IServiceAccount
  );

  // ==========================================
  // Inits Access Control Management with GDA
  // ==========================================
  if (configs.gda.provision) {
    await initGdaPermissions();
  }

  // ==========================================
  // Initializes the JWT Validation library.
  // ==========================================
  initJwtValidationLib(
    createLogger,
    () => {
      return correlationIdService.getId();
    },
    configs.security.jwt.host
  );

  // ==========================================
  // Initializes the Knex Utils library.
  // ==========================================
  initKnexUtilsLib(createLogger);

  await initDatabase(!configs.testingMode);

  // ==========================================
  // Initializes the Geo Utils library.
  // ==========================================
  initGeoUtils(createLogger);
}
