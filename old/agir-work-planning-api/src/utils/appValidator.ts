// ==========================================
// Application validator
// ==========================================

import { configs } from '../../config/configs';
import { constants } from '../../config/constants';
import { openApiValidator } from '../../open-api/openApiValidator';
import { createLogger } from '../utils/logger';

import * as express from 'express';

const logger = createLogger('server');

/**
 * Validates that the app is valid and ready to be
 * started.
 */
export async function validateApp(app: express.Express): Promise<void> {
  logger.info('Validating the application...');

  // ==========================================
  // Validates Open API
  // ==========================================
  await openApiValidator.validate(app);

  // ==========================================
  // Validates that all our custom "@villemontreal"
  // libraries used as dependencies in this project
  // have been properly initialized.
  //
  // The contract is that a library exporting a "isInited()"
  // fonction must have been initialized for the application
  // to be valid (and be started).
  // ==========================================
  const packageJson = require(`${configs.root}/package.json`);

  const depsObj: any = packageJson.dependencies;
  Object.keys(depsObj).forEach(depName => {
    if (depName && depName.startsWith(`${constants.libraries.MONTREAL_SCOPE}/`)) {
      const libModule = require(depName);
      if (libModule.isInited !== undefined && !libModule.isInited()) {
        throw new Error(
          `The dependency "${depName}" MUST be initialized before the application can be started! Please ` +
            `have a look at that library's documentation.`
        );
      }
    }
  });

  logger.info('The application is valid!');
}
