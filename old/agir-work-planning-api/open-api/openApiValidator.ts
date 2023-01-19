// ==========================================
// Open API validator
// ==========================================

import * as express from 'express';
import { configs } from '../config/configs';
import { httpMethodFromString, httpMethodToString, IRoute } from '../src/models/core/route';
import { getAPIRoutes } from '../src/routes';
const swaggerParser = require('swagger-parser');

/**
 * Open API validator
 */
export class OpenApiValidator {
  /**
   * Validates the Open Api related components
   * in the application.
   *
   * Throws an Error if something is invalid!
   */
  public validate(app: express.Express): Promise<void> {
    const parser = new swaggerParser();
    const specsFilePath = configs.root + '/open-api/open-api.yaml';

    // ==========================================
    // Parses and validates the schema of the Open API
    // specs file.
    // ==========================================
    return parser
      .dereference(specsFilePath, {
        allow: {
          json: false,
          empty: false
        },
        validate: {
          schema: true,
          spec: true
        }
      })
      .catch((err: any) => {
        throw new Error(`The "${specsFilePath}" file is not valid as an Open API specs : ${err}`);
      })
      .then((api: any) => {
        // ==========================================
        // Validate the routes
        // ==========================================
        return this.validateRoutes(api, app);
      });
  }

  /**
   * Validation of the routes.
   */
  protected validateRoutes(api: any, app: express.Express): Promise<void> {
    // ==========================================
    // The routes defined in the Open API
    // specs file.
    // ==========================================
    const openApiRoutes: IRoute[] = this.getOpenApiRoutes(api);

    // ==========================================
    // The routes defined in the application as
    // being "API routes"
    // ==========================================
    const appApiRoutes: IRoute[] = this.getAppApiRoutes(app);

    const errors: string[] = [];

    outer: for (const openApiRoute of openApiRoutes) {
      const path = openApiRoute.path;
      const httpMethod = openApiRoute.method;
      for (const appRoute of appApiRoutes) {
        if (path === appRoute.path && httpMethod === appRoute.method) {
          continue outer;
        }
      }
      errors.push(
        `The route "[${httpMethodToString(httpMethod)}] ${path}" was found in the ` +
          ` Open API specs file but not in the "routes.ts" file.`
      );
    }

    outer: for (const appRoute of appApiRoutes) {
      const path = appRoute.path;
      const httpMethod = appRoute.method;
      for (const openApiRoute of openApiRoutes) {
        if (path === openApiRoute.path && httpMethod === openApiRoute.method) {
          continue outer;
        }
      }
      errors.push(
        `The route "[${httpMethodToString(httpMethod)}] ${path}" was found in the ` +
          `"routes.ts" file, but not in the Open API specs file.`
      );
    }

    // ==========================================
    // Some errors...
    // ==========================================
    if (errors.length > 0) {
      return Promise.reject('- ' + errors.join('\n- '));
    }

    // ==========================================
    // Ok, routes are valid!
    // ==========================================
    return Promise.resolve();
  }

  /**
   * Returns the routes defined in the Open API
   * specs file.
   */
  protected getOpenApiRoutes(api: any): IRoute[] {
    const routes: IRoute[] = [];

    if (api.paths) {
      for (let path in api.paths) {
        if (api.paths.hasOwnProperty(path)) {
          const pathObj = api.paths[path];

          // ==========================================
          // Open API uses "{someParam}" as the syntax for
          // dynamic parameters...
          // We have to convert those to the format of the
          // target web framework.
          // ==========================================
          path = this.convertOpenApiPathToFrameworkPath(path);

          for (const httpMethodStr in pathObj) {
            if (pathObj.hasOwnProperty(httpMethodStr)) {
              const httpMethod = httpMethodFromString(httpMethodStr);
              routes.push({
                path,
                method: httpMethod
              });
            }
          }
        }
      }
    }

    return routes;
  }

  /**
   * Returns public API routes of the application, as defined in
   * the "routes.ts" file.
   *
   * We also make sure that all of the routes defined in the
   * "routes.ts" file are present in the "app" object
   * itself.
   */
  protected getAppApiRoutes(app: express.Express): IRoute[] {
    const routesInRoutesFile: any = {};
    for (const route of getAPIRoutes()) {
      const method = httpMethodToString(route.method);
      routesInRoutesFile[method] = routesInRoutesFile[method] || {};
      routesInRoutesFile[method][route.path] = true;
    }

    const routeWrappers = app._router.stack;
    if (routeWrappers) {
      for (const routeWrapper of routeWrappers) {
        if (routeWrapper.route) {
          const routeObj = routeWrapper.route;
          for (const httpMethod in routeObj.methods) {
            if (routesInRoutesFile[httpMethod] && routesInRoutesFile[httpMethod][routeObj.path]) {
              delete routesInRoutesFile[httpMethod][routeObj.path];
            }
          }
        }
      }
    }

    for (const httpMethod in routesInRoutesFile) {
      if (routesInRoutesFile[httpMethod].size && routesInRoutesFile[httpMethod].size() > 0) {
        throw new Error(
          `An API route is defined in the "routes.ts" file but was not found in the ` +
            `application : [${httpMethod}] ${routesInRoutesFile[httpMethod][0]}`
        );
      }
    }

    return getAPIRoutes();
  }

  /**
   * Converts an Open API path to the format of the
   * target web framework.
   */
  protected convertOpenApiPathToFrameworkPath = (path: string): string => {
    if (!path) {
      return '';
    }

    let finalPath: string = '';

    const tokens = path.split('/');
    for (let token of tokens) {
      if (token) {
        if (token.startsWith('{') && token.endsWith('}')) {
          token = ':' + token.substring(1, token.length - 1);
        }
        finalPath += '/' + token;
      }
    }

    return finalPath;
  };
}

export let openApiValidator: OpenApiValidator = new OpenApiValidator();
