// ==========================================
// Open API/Swagger configurations and routes.
// ==========================================
import * as express from 'express';
import * as fs from 'fs';
import * as HttpStatusCodes from 'http-status-codes';
import * as yaml from 'js-yaml';
import * as getRawBody from 'raw-body';

import { configs } from '../config/configs';
import { EndpointTypes } from '../config/constants';
import { addRoute } from '../src/core/app';
import { HttpMethods } from '../src/models/core/route';
import { createLogger } from '../src/utils/logger';
import { appUtils } from '../src/utils/utils';

const logger = createLogger('openApiConfigurer');

/**
 * Open API doc cache.
 */
let openAPiDocCache: string;

/**
 * Open API Editor Config cache.
 */
let swaggerEditorBundleCache: string;

/**
 * Configures Open IPA and adds the required routes.
 *
 * @param port The port may be something else then the
 * default API port, if we start the Swagger Editor in
 * standalone mode.
 */
export function configureOpenApi(
  app: express.Express,
  serveSpecsFile: boolean = true,
  serveEditor: boolean = true,
  serveUi: boolean = true,
  port: number = configs.api.port
) {
  const openApiSpecsUrl = appUtils.createPublicUrl(
    configs.routing.routes.openAPI.specsFile,
    EndpointTypes.DOCUMENTATION,
    port
  );

  // ==========================================
  // Open API/Swagger specs file
  // ==========================================
  const apiDocPath = configs.root + '/open-api/open-api.yaml';

  if (serveSpecsFile) {
    addRoute(app, {
      endpointType: EndpointTypes.DOCUMENTATION,
      method: HttpMethods.GET,
      path: configs.routing.routes.openAPI.specsFile,
      // tslint:disable-next-line: no-async-without-await
      async handler(req, res, next) {
        res.setHeader('content-type', 'application/x-yaml');

        if (!openAPiDocCache || configs.environment.isLocalOrDev) {
          // ==========================================
          // We dynamically add the right "scheme", "host"
          // and "basePath"
          // ==========================================
          const doc = yaml.safeLoad(fs.readFileSync(apiDocPath, 'UTF-8'));
          doc.host = `${configs.api.host}:${configs.api.port}`;
          doc.schemes = [configs.api.scheme];
          doc.basePath = appUtils.createPublicFullPath('/', EndpointTypes.API);

          openAPiDocCache = yaml.safeDump(doc);
        }

        res.send(openAPiDocCache);
      }
    });
  }

  // ==========================================
  // Open API/Swagger UI
  // ==========================================
  if (serveUi) {
    addRoute(app, {
      method: HttpMethods.GET,
      path: configs.routing.routes.openAPI.ui,
      // tslint:disable-next-line: no-async-without-await
      async handler(req, res, next) {
        // ==========================================
        // If no url is specified, we redirect to our
        // api docs.
        // ==========================================
        if (!req.query.url) {
          res.redirect('?url=' + openApiSpecsUrl);
        } else {
          next();
        }
      },
      endpointType: EndpointTypes.DOCUMENTATION
    });

    const fullPath = appUtils.createPublicFullPath(configs.routing.routes.openAPI.ui, EndpointTypes.DOCUMENTATION);
    app.use(fullPath, express.static(configs.root + '/open-api/swagger-ui/dist'));
  }

  // ==========================================
  // Open API/Swagger Editor
  // ==========================================
  if (serveEditor && configs.openApi.exposeSwaggerEditor) {
    // ==========================================
    // This is a workaround required since Swagger Editor 3
    // doesn't support saving to a backend yet :
    // https://github.com/swagger-api/swagger-editor/issues/1241
    //
    // So we tweak the "swagger-editor-bundle.js" file in order
    // to make is sent the modifications to the server instead
    // of using the browser localStorage!
    // ==========================================
    addRoute(app, {
      method: HttpMethods.GET,
      path: configs.routing.routes.openAPI.editor + '/dist/swagger-editor-bundle.js',
      // tslint:disable-next-line: no-async-without-await
      async handler(req, res, next) {
        res.setHeader('content-type', 'application/javascript');

        if (!swaggerEditorBundleCache) {
          let content: string = fs.readFileSync(
            configs.root + '/open-api/swagger-editor/dist/swagger-editor-bundle.js',
            'UTF-8'
          );

          // ==========================================
          // We don't show any initial content. We wait
          // for the real specs file to be loaded from the
          // server...
          // ==========================================
          content = content.replace(
            'function saveContentToStorage(str) {',
            `localStorage.setItem(CONTENT_KEY, 'Loading...');\nfunction saveContentToStorage(str) {`
          );

          content = content.replace(
            'return localStorage.setItem(CONTENT_KEY, str);',
            `if(str === 'Loading...') {` +
              `location.reload();` +
              `return;` +
              `};` +
              `var xhr = new XMLHttpRequest();` +
              `xhr.open('PUT', "${openApiSpecsUrl}", true);` +
              `xhr.send(str);`
          );

          swaggerEditorBundleCache = content;
        }

        res.send(swaggerEditorBundleCache);
      },
      endpointType: EndpointTypes.DOCUMENTATION
    });

    // ==========================================
    // Writable endpoint for the editor
    // ==========================================
    addRoute(app, {
      method: HttpMethods.PUT,
      path: configs.routing.routes.openAPI.specsFile,
      async handler(req, res, next) {
        return getRawBody(req, 'UTF-8').then((content: string) => {
          // ==========================================
          // We do not save the "scheme", "host" or
          // "basePath" properties.
          // They are going to be added dynamically when the doc
          // is served.
          // ==========================================
          let doc;
          try {
            doc = yaml.safeLoad(content);
          } catch (err) {
            logger.warning(`Invalid YAML, the specs file won't be saved : ${err.message}`);
            res.statusCode = HttpStatusCodes.BAD_REQUEST;
            return res.end('err');
          }

          delete doc.host;
          delete doc.schemes;
          delete doc.basePath;
          const contentYaml = yaml.safeDump(doc);

          fs.writeFileSync(apiDocPath, contentYaml, 'UTF-8');

          // delete doc cache
          openAPiDocCache = null;

          res.end('ok');
        });
      },
      endpointType: EndpointTypes.DOCUMENTATION
    });

    addRoute(app, {
      method: HttpMethods.GET,
      path: configs.routing.routes.openAPI.editor,
      // tslint:disable-next-line: no-async-without-await
      async handler(req, res, next) {
        // ==========================================
        // If no url is specified, we redirect to our
        // api docs.
        // ==========================================
        if (!req.query.url) {
          res.redirect('?url=' + openApiSpecsUrl);
        } else {
          next();
        }
      },
      endpointType: EndpointTypes.DOCUMENTATION
    });

    // ==========================================
    // The editor itself
    // Must be added *after* the previous routes!
    // ==========================================
    const fullPath = appUtils.createPublicFullPath(configs.routing.routes.openAPI.editor, EndpointTypes.DOCUMENTATION);
    app.use(fullPath, express.static(configs.root + '/open-api/swagger-editor'));
  }
}
