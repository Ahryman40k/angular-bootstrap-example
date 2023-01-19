// ==========================================
// Exports a function to start the HTTP server
// of the application.
//
// Console outputs are OK when starting the server.
// tslint:disable:no-console
// ==========================================
import express = require('express');
import * as http from 'http';

import { configs } from '../../config/configs';
import { constants, EndpointTypes } from '../../config/constants';
import { validateApp } from '../utils/appValidator';
import { createLogger } from '../utils/logger';
import { appUtils } from '../utils/utils';
import { createDefaultApp } from './app';

const logger = createLogger('startServer');
let server: http.Server = null;

export async function startServer() {
  logEnvironmentExists();

  // ==========================================
  // Creates the application, with the default
  // API routes.
  // ==========================================
  const app = await createDefaultApp();

  // ==========================================
  // Validates the application
  // ==========================================
  await validateApplication(app);

  // ==========================================
  // Starts the server!
  // ==========================================
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(configs.server.port, () => {
        logger.info(`Server started on port ${configs.server.port}`);
        logger.info(`Project root : ${configs.root}`);

        const msg = getLogMsg();
        logger.info(msg);

        resolve(undefined);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Log that an environment is set
 * @returns
 */
function logEnvironmentExists(): void {
  if (!process.env[constants.EnvVariables.ENV_TYPE]) {
    logger.warning(
      `No ${constants.EnvVariables.ENV_TYPE} environment variable found! A default will be used : ` +
        configs.environment.type
    );
  }
}

async function validateApplication(app: express.Express): Promise<void> {
  try {
    if (process.env['dev-fast-start'] !== 'true') {
      await validateApp(app);
    }
  } catch (err) {
    logger.error(err);

    if (configs.openApi.exposeSwaggerEditor) {
      logger.info(
        `NOTE : You still can run "gulp editor" to serve the Swagger Editor to help you edit the specs file!`
      );
    }
    return process.exit(-1);
  }
}

function getLogMsg(): string {
  let loadedFileStr = '';
  for (const loadedFile of configs.configurationInfo.loadedFiles) {
    loadedFileStr += `- ${loadedFile}\n`;
  }

  const packageJson = require(`${configs.root}/package.json`);

  const apiBaseUrl = appUtils.createPublicUrl('/', EndpointTypes.API);
  const root = appUtils.createPublicUrl('/', EndpointTypes.NONE);
  return (
    // tslint:disable-next-line:prefer-template
    `\n==========================================\n` +
    `~~~ ${packageJson.description || packageJson.name} ~~~\n\n` +
    `Info page : ${root}\n` +
    `API entry point : ${apiBaseUrl}\n` +
    `Server port : ${configs.server.port}\n` +
    `NODE_ENV environment variable : ${process.env.NODE_ENV || 'undefined'}\n` +
    `Instance : ${configs.environment.instance}\n` +
    `Environment : ${configs.environment.type}\n` +
    `Is local? : ${configs.environment.isLocal ? 'true' : 'false'}\n` +
    `Config files used : \n${loadedFileStr}\n` +
    `==========================================\n\n`
  );
}

/**
 * Stops the server.
 */
export function stopServer() {
  if (server) {
    try {
      server.close();
    } catch (err) {
      logger.warning(`Error closing the server : ${err}`);
    } finally {
      server = null;
    }
  } else {
    logger.warning(`No server to stop!`);
  }
}
