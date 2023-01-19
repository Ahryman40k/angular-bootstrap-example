// ==========================================
// Unlisted routes
// ==========================================
import * as express from 'express';

import { configs } from '../../config/configs';
import { constants, EndpointTypes } from '../../config/constants';
import { devController } from '../controllers/core/devController';
import { diagnosticsController } from '../controllers/core/diagnosticsController';
import { HttpMethods, IHandlerRoute } from '../models/core/route';

/**
 * Routes that are *not* part of the public API, not
 * listed in the Open API specs file!
 */
export function getUnlistedRoutes(): IHandlerRoute[] {
  const dummyImageHandler = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end();
  };

  const dummyTextHandler = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.writeHead(200, { 'Content-Type': constants.mediaTypes.PLAIN_TEXT });
    res.end();
  };

  return [
    // ==========================================
    // Common files that can be requested in development
    // but that we don't care about since this is an API.
    // Those handlers prevent 404 errors to be logged.
    // ==========================================
    { method: HttpMethods.GET, path: '/favicon.ico', handler: dummyImageHandler, endpointType: EndpointTypes.NONE },
    {
      method: HttpMethods.GET,
      path: '/apple-touch-icon.png',
      handler: dummyImageHandler,
      endpointType: EndpointTypes.NONE
    },
    { method: HttpMethods.GET, path: '/tile.png', handler: dummyImageHandler, endpointType: EndpointTypes.NONE },
    {
      method: HttpMethods.GET,
      path: '/tile-wide.png',
      handler: dummyImageHandler,
      endpointType: EndpointTypes.NONE
    },
    { method: HttpMethods.GET, path: '/robots.txt', handler: dummyTextHandler, endpointType: EndpointTypes.NONE },
    { method: HttpMethods.GET, path: '/humans.txt', handler: dummyTextHandler, endpointType: EndpointTypes.NONE },
    {
      method: HttpMethods.GET,
      path: '/browserconfig.xml',
      handler: dummyTextHandler,
      endpointType: EndpointTypes.NONE
    },

    // ==========================================
    // Root/Dev endpoints
    //
    // Those will only be available locally, during
    // development. They are a quick way for a developer
    // to get informations about the current project.
    // ==========================================
    { method: HttpMethods.GET, path: '/', handler: devController.index, endpointType: EndpointTypes.NONE },
    {
      method: HttpMethods.GET,
      path: '/open-api',
      handler: devController.openAPI,
      endpointType: EndpointTypes.NONE
    },
    { method: HttpMethods.GET, path: '/health', handler: devController.health, endpointType: EndpointTypes.NONE },
    { method: HttpMethods.GET, path: '/metrics', handler: devController.metrics, endpointType: EndpointTypes.NONE },
    { method: HttpMethods.GET, path: '/readme', handler: devController.readme, endpointType: EndpointTypes.NONE },

    // ==========================================
    // Diagnostics
    // ==========================================
    {
      method: HttpMethods.GET,
      path: configs.routing.routes.diagnostics.ping,
      handler: diagnosticsController.ping,
      endpointType: EndpointTypes.DIAGNOSTICS
    },
    {
      method: HttpMethods.GET,
      path: configs.routing.routes.diagnostics.info,
      handler: diagnosticsController.info,
      endpointType: EndpointTypes.DIAGNOSTICS
    },
    {
      method: HttpMethods.GET,
      path: configs.routing.routes.diagnostics.metrics,
      handler: diagnosticsController.metrics,
      endpointType: EndpointTypes.DIAGNOSTICS
    },
    {
      method: HttpMethods.GET,
      path: configs.routing.routes.diagnostics.healthCheck,
      handler: diagnosticsController.healthCheck,
      endpointType: EndpointTypes.DIAGNOSTICS
    },
    {
      method: HttpMethods.GET,
      path: configs.routing.routes.diagnostics.healthReport,
      handler: diagnosticsController.healthReport,
      endpointType: EndpointTypes.DIAGNOSTICS
    },
    // Add local routes for ping and metrics that will be called by Kubernetes and Prometheus,
    // regardless of the business domain.
    {
      method: HttpMethods.GET,
      path: configs.routing.routes.rootDiagnostics.ping,
      handler: diagnosticsController.ping,
      endpointType: EndpointTypes.NONE
    },
    {
      method: HttpMethods.GET,
      path: configs.routing.routes.rootDiagnostics.info,
      handler: diagnosticsController.info,
      endpointType: EndpointTypes.NONE
    },
    {
      method: HttpMethods.GET,
      path: configs.routing.routes.rootDiagnostics.metrics,
      handler: diagnosticsController.metrics,
      endpointType: EndpointTypes.NONE
    }
  ];
}
