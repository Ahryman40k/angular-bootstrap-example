import { debug } from 'console';
import { createServerConfiguration, ServerConfig } from './config';
import { createServices } from './domain';
import { createStorages } from './infrastructure';
import { getRoutes, RouterRoutes } from './routes';

import express from 'express';
import path from 'path';
import http from 'http';


const createVdmServer = (
  config: ServerConfig,
  routes: RouterRoutes
) => {
  const app = express();

  app.use(express.json());
  app.use('/assets', express.static(path.join(__dirname, 'assets')));

  Object.keys(routes).forEach((key ) => {
    const [ method, path ] = key.split('.');
    
    // TODO: should validate method verb ...

    const { /*method, path,*/ middlewares, handler } = routes[key];

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    app[method](path, ...middlewares, handler);
  });   

  app.get('/api', (req, res) => {
    res.send({ message: 'Welcome to project-api!' });
  });

  let server: http.Server | null = null;
  const start = () => {
    const port = config.server.port || 3333;
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

const serverConfig = createServerConfiguration();

(async () => {
  const storages = await createStorages(serverConfig.infrastructure);
  const services = createServices(storages);
  const routes = getRoutes(services);

  const server = createVdmServer(serverConfig, routes);
  server.start();
})();
