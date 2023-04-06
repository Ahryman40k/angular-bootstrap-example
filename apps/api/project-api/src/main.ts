/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import path from 'path';
import http from 'http';

import { createProjectService } from './domain';
import { createInMemoryDb } from './infrastructure/in-memory-project.infrastructure';
import { RouteDescriptor } from './routes/controllers/project.controller';
import { getRoutes } from './routes/routes';
import { debug } from 'console';

const createVdmServer = (config: any, routes: RouteDescriptor<express.RequestHandler>[]) => {
  const app = express();

  app.use(express.json());
  app.use('/assets', express.static(path.join(__dirname, 'assets')));

  routes.forEach((route) => {
    app[route.method](route.path, ...route.middlewares, route.handler);
  });

  app.get('/api', (req, res) => {
    res.send({ message: 'Welcome to project-api!' });
  });

  let server: http.Server | null = null;
  const start = () => {
    const port = process.env.port || 3333;
    server = app.listen(port, () => {
      console.log(`Listening at http://localhost:${port}/api`);
    });
    server.on('error', console.error);
  };

  process.on('SIGTERM', () => {
    debug('SIGTERM signal received: closing HTTP server');
    if (server)
      server.close(() => {
        debug('HTTP server closed');
      });
  });

  const close = () => {
    if (server) server.close();
  };

  return {
    start,
    close,
  };
};

const config = {
  // Whatever I need here
  // Can also be validated with Zod
};

const systema = createInMemoryDb(config);
const service = createProjectService({ memory: systema });
const routes = getRoutes(config, {project_service: service} );

createVdmServer(config, routes);
