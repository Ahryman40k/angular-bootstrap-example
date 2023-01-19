// ==========================================
// Application object
// ==========================================
import { createCorrelationIdMiddleware } from '@villemontreal/core-correlation-id-nodejs-lib';
import { jwtValidationMiddleware } from '@villemontreal/core-jwt-validator-nodejs-lib';
import { createError } from '@villemontreal/core-utils-general-nodejs-lib';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as handlerbars from 'express-handlebars';
import * as fs from 'fs-extra';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as HttpStatusCodes from 'http-status-codes';
import promClient = require('prom-client');

import { configs } from '../../config/configs';
import { constants, EndpointTypes, globalConstants } from '../../config/constants';
import { corsOptionsDelegate } from '../../config/cors';
import { configureOpenApi } from '../../open-api/openApiConfigurer';
import { initComponents } from '../init';
import { tokenTranslatorMiddleware } from '../middlewares/tokenTranslatorMiddleware';
import { userProviderMiddleware } from '../middlewares/userProviderMiddleware';
import { httpMethodtoExpressMethodName, IHandlerRoute } from '../models/core/route';
import { getAPIRoutes } from '../routes';
import { createLogger, LogLevel } from '../utils/logger';
import { appUtils, utils } from '../utils/utils';
import { addErrorHandlers } from './errorManagement';
import { getUnlistedRoutes } from './unlistedRoutes';

promClient.collectDefaultMetrics({ timeout: 10000 });
promClient.register.setDefaultLabels({
  app_instance: configs.environment.instance || 'default',
  version: require(configs.root + '/package.json').version
});
const promBundle = require('express-prom-bundle');
const metricsMiddleware = promBundle({
  includeMethod: true,
  autoregister: false
});

const logger = createLogger('app');
const jwtSecurity = configs.security.jwt;

/**
 * Creates an application object.
 *
 * @param apiRoutes the public API routes to add to this app.
 * Use createDefaultApp() to create an application object using the
 * default API routes taken from the "src/routes.ts" file.
 */
export async function createApp(apiRoutes: IHandlerRoute[]): Promise<express.Express> {
  // ==========================================
  // Express app
  // ==========================================
  const app = express();

  // ==========================================
  // Case sensitive routing?
  //
  // This config *must* be set before any other
  // "set"...
  // @see https://github.com/expressjs/express/issues/2505#issuecomment-70505092
  // ==========================================
  app.set('case sensitive routing', configs.routing.caseSensitive);
  app.disable('x-powered-by');

  // ==========================================
  // register Prometheus middleware
  // ==========================================
  app.use(metricsMiddleware);

  app.use(bodyParser.urlencoded({ extended: true, limit: configs.routing.maxRequestSizeMb + 'mb' }));
  app.use(bodyParser.json({ limit: configs.routing.maxRequestSizeMb + 'mb' }));

  // ==========================================
  // Correlation ID management
  //
  // Only applied on "/api" requests.
  //
  // WARNING!! : For some reason, this middleware must
  // go *after* the "bodyParser.json" one, or otherwise
  // the correlation ID won't be available on POST requests!!
  //
  // ==========================================
  app.use(
    createCorrelationIdMiddleware((req: express.Request): boolean => {
      return req && req.path && req.path.toLowerCase().startsWith(constants.EnpointTypeRoots.API);
    })
  );

  catchErrorFromBodyParser(app);

  // ==========================================
  // Enable CORS
  //
  // For fine grain configuration, have a look
  // at https://github.com/expressjs/cors
  // ==========================================
  app.use(cors(corsOptionsDelegate as cors.CorsOptions));

  // ==========================================
  //        JWT Validation middleware
  // ==========================================
  applyJwtMiddleware(app);

  // ==========================================
  // User Provider middleware
  // Adds the user to the request object.
  // ==========================================
  app.use(userProviderMiddleware);

  // ==========================================
  // Handlerbars templating engine (mostly for the
  // root HTML "info" page).
  // ==========================================
  app.engine(
    '.hbs',
    handlerbars({
      defaultLayout: 'mainLayout',
      extname: '.hbs',
      layoutsDir: 'html/layouts/',
      partialsDir: 'html/partials/'
    })
  );
  app.set('views', 'html');
  app.set('view engine', '.hbs');
  if (configs.templatingEngine.enableCache) {
    app.enable('view cache');
  }

  initAccessLog(app);

  // ==========================================
  // Static dev public files, under "/public".
  //
  // Those will only be available locally, when in
  // development. They are a quick way for a developer
  // to get informations about the current project.
  // ==========================================
  const devPublicPathRoot = appUtils.createPublicFullPath('/public', EndpointTypes.NONE);
  app.use(devPublicPathRoot, express.static('html/public'));

  // ==========================================
  // Enable CORS
  //
  // For fine grain configuration, have a look
  // at https://github.com/expressjs/cors
  // ==========================================
  app.use(cors());

  // ==========================================
  // Configures Open API/Swagger and adds the
  // associated routes
  // ==========================================
  configureOpenApi(app);

  // ==========================================
  // Adds the public API routes
  // ==========================================
  addRoutes(app, apiRoutes);

  // ==========================================
  // Adds the unlisted routes
  // ==========================================
  addRoutes(app, getUnlistedRoutes());

  add405Routes(app);

  // ==========================================
  // Adds error handlers.
  // Those must go *after* the regular routes
  // definitions.
  // ==========================================
  addErrorHandlers(app);

  // ==========================================
  // Some core initialization,  before the
  // application is considered as being ready
  // to be started...
  // ==========================================
  await initCoreComponents();

  // ==========================================
  // Some custom initialization, before the
  // application is considered as being ready
  // to be started...
  // ==========================================
  await initComponents();

  return app;
}
/**
 * Catch error from bodyParser to parse JSON
 * @param app
 */
function catchErrorFromBodyParser(app: express.Express): void {
  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error.status === 400 && error instanceof SyntaxError && 'body' in error) {
      throw createError(
        globalConstants.errors.apiGeneralErrors.codes.INVALID_JSON_BODY,
        'Invalid body content: ' + error
      )
        .httpStatus(HttpStatusCodes.BAD_REQUEST)
        .publicMessage('Invalid body content')
        .target('body')
        .logLevel(LogLevel.INFO)
        .logStackTrace(false)
        .build();
    } else {
      next(error);
    }
  });
}

/**
 * Init access log
 * https://confluence.montreal.ca/pages/viewpage.action?pageId=43530740
 * https://docs.microsoft.com/en-us/windows/win32/http/iis-logging
 * https://www.w3.org/TR/WD-logfile.html
 * @param app
 */
function initAccessLog(app: express.Express): void {
  app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
    if (canLogHttpRequest(request)) {
      (request as any)._startAt = process.hrtime();
      (request as any)._startTime = new Date();
      response.on('finish', () => {
        const statusCode = getStatusCode(response);

        const now = process.hrtime();
        const start: [number, number] = (request as any)._startAt as [number, number];

        const ip = getIp(request);

        const user = getUser(request);
        const url = getUrl(request);
        const method = request.method;
        const cid = getCid(request);
        const startDate = ((request as any)._startTime as Date).getTime();
        const contentLength = (response as any)._contentLength;
        // user-agent:return req.headers['user-agent']
        const shortMessage = `${method} ${statusCode} ${url}`;
        const errorFromUpstream = getErrorFromUpstream(response);
        // calculate diff (from morgan source code)
        const duration = (now[0] - start[0]) * 1e3 + (now[1] - start[1]) * 1e-6;
        const appName = 'agir-planif-api'; // TODO voir si on peut obtenir cette information dynamiquement
        const logType = 'mtl';
        const logTypeVersion = 2;
        const level = 20;

        const accessLog = {
          app: appName,
          logType,
          logTypeVersion,
          version: '1.1.0',
          short_message: shortMessage,
          timestamp: startDate,
          access: true,
          level,
          statusCode,
          method,
          url,
          remote_ip: ip,
          user,
          cid,
          duration,
          length: contentLength,
          errorFromUpstream
        };

        logger.debug(JSON.stringify(accessLog));
      });
    }
    next();
  });
}

/**
 * Get Status Code
 * @param response
 * @returns
 */
function getStatusCode(response: any): string {
  const statusSent: boolean =
    typeof response.headersSent !== 'boolean' ? Boolean(response._header) : response.headersSent;
  return statusSent ? String(response.statusCode) : undefined;
}

/**
 * Get Ip
 * @param request
 * @returns
 */
function getIp(request: express.Request): string {
  return (
    request.ip ||
    (request as any)._remoteAddress ||
    (request.connection && request.connection.remoteAddress) ||
    undefined
  );
}

/**
 * Get User
 * @param request
 * @returns
 */
function getUser(request: any): string {
  return request.jwt?.userName || '';
}

/**
 * Get Url
 * @param request
 * @returns
 */
function getUrl(request: express.Request): string {
  return request.originalUrl || request.url;
}

/**
 * Get Cid
 * @param request
 * @returns
 */
function getCid(request: express.Request): string {
  return request.get('X-Correlation-Id') ? request.get('X-Correlation-Id') : '';
}

/**
 * Get Error From Upstream
 * @param response
 * @returns
 */
function getErrorFromUpstream(response: any): string {
  return response.errorFromUpstream ? 'true' : 'false';
}
/**
 * Adds "catch-all" routes so requests using unssupported methods are responded
 * with "405 Method Not Allowed" + the appropriate "Allow" header.
 *
 * IMPORTANT: that function should be used after all routes are defined.
 */
function add405Routes(app: express.Express) {
  const allowedMethodsByPath = getAllowedMethodsByPath(app);

  for (const path of Object.keys(allowedMethodsByPath)) {
    app.route(path).all(create405Responder(Array.from(allowedMethodsByPath[path])));
  }
}

/**
 * Returns the methods allowed for the different routes defined in the provided
 * Express application.
 */
function getAllowedMethodsByPath(app: express.Express): { [key: string]: Set<string> } {
  const allowedMethodsByPath: { [key: string]: Set<string> } = {};

  for (const layer of app._router.stack) {
    if (layer.route) {
      const route = layer.route;
      if (route.path) {
        const path = route.path;

        let allowedMethods = allowedMethodsByPath[path];
        if (!allowedMethods) {
          allowedMethods = new Set<string>();
          allowedMethodsByPath[path] = allowedMethods;
        }
        for (const method of Object.keys(route.methods)) {
          allowedMethods.add(method);
        }
      }
    }
  }

  return allowedMethodsByPath;
}

/**
 * Creates a request handler responding with 405 and the proper "Allow" header
 * given the allowed methods.
 *
 * @param allowedMethods HTTP methods to make the "Allow" header with.
 */
function create405Responder(allowedMethods: string[]) {
  return (request: express.Request, response: express.Response) => {
    response.setHeader(httpHeaderFieldsTyped.ALLOW, allowedMethods.join(',').toUpperCase());
    response.sendStatus(HttpStatusCodes.METHOD_NOT_ALLOWED);
  };
}

/**
 * Creates the default application object, using the
 * default API routes taken from the "src/routes.ts" file.
 */
export async function createDefaultApp(): Promise<express.Express> {
  return createApp(getAPIRoutes());
}

/**
 * Adds the route to the Express app but first wraps ot with the special
 * "wrapAsyncHandler()" function to manage some errors automatically.
 */
export function addRoute(app: express.Express, route: IHandlerRoute) {
  return addRoutes(app, [route]);
}

/**
 * Adds the routes to the Express app but first wraps them with the special
 * "wrapAsyncHandler()" function to manage some errors automatically.
 */
export function addRoutes(app: express.Express, routes: IHandlerRoute[]) {
  if (app && routes) {
    routes.forEach(route => {
      if (route) {
        // ==========================================
        // Creates the full path, given the type of
        // endpoint.
        // ==========================================
        const fullPath = appUtils.createPublicFullPath(route.path, route.endpointType);
        let middlewares = route.middlewares || [];

        middlewares = middlewares.map(m => {
          return wrapAsyncHandler(
            async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
              // prettier-ignore
              // tslint:disable-next-line:await-promise
              await m(req, res, next); // NOSONAR
            }
          );
        });

        app[httpMethodtoExpressMethodName(route.method)](fullPath, middlewares, wrapAsyncHandler(route.handler));
      }
    });
  }
}

/**
 * Calls Express's "next(error)" automatically when an error occured in
 * the specified async handler. Also makes sure the handler correctly manage
 * its async manipulations by forcing it to generate a
 * response, to call "next()" or "render()" by itself.
 */
export function wrapAsyncHandler(
  handler: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void> | void
): (req: express.Request, res: express.Response, next: express.NextFunction) => void | Promise<void> {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // ==========================================
    // Wrapper to check if "next()" was called.
    // ==========================================
    let nextWasCalled = false;
    const nextWrapper = (err?: any) => {
      nextWasCalled = true;
      next(err);
    };

    // ==========================================
    // Wrapper to check if "render()" was called.
    // ==========================================
    let renderWasCalled = false;
    const renderOriginal = res.render;
    res.render = (...params: any[]) => {
      renderWasCalled = true;
      renderOriginal.apply(res, params);
    };

    // ==========================================
    // Wrapper to check if "sendFile()" was called.
    // ==========================================
    let sentFileWasCalled = false;
    const sentFileOriginal = res.sendFile;
    res.sendFile = (...params: any[]) => {
      sentFileWasCalled = true;
      sentFileOriginal.apply(res, params);
    };

    try {
      // ==========================================
      // Calls the handler.
      // ==========================================
      await handler(req, res, nextWrapper);

      // ============================================
      // We force the handlers to generate a
      // response, to call "next()", "render()" or "sendFile()".
      // ==========================================
      if (!res.headersSent && !nextWasCalled && !renderWasCalled && !sentFileWasCalled) {
        throw new Error(
          'The handler did not send any response and did not call "next()", "render()" or "sendFile()"! Request : ' +
            req.url
        );
      }
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Initialization of some core thigs, before the
 * application is actually started.
 */
async function initCoreComponents() {
  // ==========================================
  // Makes sure the "test-data" folder exists.
  // ==========================================
  if (!fs.existsSync(configs.testDataDirPath)) {
    fs.mkdirsSync(configs.testDataDirPath);
  } else if (!configs.testingMode) {
    await utils.clearDir(configs.testDataDirPath);
  }
}

/**
 * Tells if we want to log the start and end of an http request
 */
function canLogHttpRequest(req: express.Request) {
  if (!req || !req.path) {
    return true;
  }
  const path = req.path.toLowerCase();

  // Do not log the following URLs which are constantly invoked by Kubernetes et by Prometheus.
  if (
    path === configs.routing.routes.rootDiagnostics.ping.toLowerCase() ||
    path === configs.routing.routes.rootDiagnostics.metrics.toLowerCase()
  ) {
    return false;
  }

  // Do not log HTML pages requests
  for (const key in constants.EnpointTypeRoots) {
    if (constants.EnpointTypeRoots.hasOwnProperty(key) && path.startsWith(constants.EnpointTypeRoots[key] + '/')) {
      return true;
    }
  }
  return false;
}

function canApplyJwtMiddleware(req: express.Request) {
  if (req && req.path) {
    const reqPath = req.path.toLowerCase();
    if (reqPath.startsWith(constants.EnpointTypeRoots.API)) {
      if (jwtSecurity.whitelist) {
        if (isRequestWhitelisted(reqPath, jwtSecurity.whitelist.ALL)) {
          return false;
        }
        if (isRequestWhitelisted(reqPath, jwtSecurity.whitelist[req.method])) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
}

function applyJwtMiddleware(app: express.Express): void {
  if (!configs.security.jwt.enable) {
    return;
  }
  const jwtMiddleware = jwtValidationMiddleware();
  app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (canApplyJwtMiddleware(req)) {
      // ====================================
      //    JWT Transformation middleware
      // ====================================
      if (configs.security.jwt.endPoints.tokenTranslator.enable) {
        try {
          logger.debug('Appliying jwt tokenTranslator ...');
          await tokenTranslatorMiddleware(req, next);
        } catch (error) {
          logger.error(error, 'Error while getting jwt from access token');
        }
      } else {
        await jwtMiddleware(req, res, next);
      }
    } else {
      if (req.path.startsWith(constants.EnpointTypeRoots.API)) {
        // Note that we log API routes only, to avoid the noise caused by the ping/metrics polling
        logger.debug({
          msg: `request ${req.method} ${req.path} is whitelisted`,
          requestUrl: req.url,
          requestMethod: req.method
        });
      }
      next();
    }
  });
}

function isRequestWhitelisted(path: string, whitelist: string[]): boolean {
  return whitelist && !!whitelist.find(pattern => path.search(pattern) >= 0);
}
