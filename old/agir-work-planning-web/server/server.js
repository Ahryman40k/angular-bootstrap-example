var http = require('http');
var path = require('path');
var express = require('express');
var promClient = require('prom-client');
var promBundle = require('express-prom-bundle');
var baseFolder = promClient.collectDefaultMetrics({ timeout: 10000 });
const metricsMiddleware = promBundle({ includeMethod: false, autoregister: false });

var httpPort = 4200;
var appFolder = path.resolve('../sites');

function createDiagnosticRouter() {
  var router = express.Router();

  router.get('/metrics', function(req, res, next) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(promClient.register.metrics());
  });

  router.get('/ping', function(req, res, next) {
    res.contentType('text/plain');
    res.send('pong');
  });

  router.get('/check', function(req, res, next) {
    res.sendStatus(200);
  });

  return router;
}

function createSpaRouter(baseFolder) {
  var router = express.Router();

  /* caching methods
  // caching for a year and never ask againg for same resources
  // Cache-Control: public, max-age=31536000
  //
  // resources will use 304 method to verify if resource has changed, if etag it will validate hash file(better method than lastUpdateDate)
  // Cache-Control: no-cache
  //
  // resources will use 200 method and never cache
  // Cache-Control: no-cache, no-store, must-revalidate
  **/
  router.use(
    '/',
    express.static(baseFolder, {
      redirect: false,
      maxAge: 0,
      cacheControl: false,
      etag: true,
      index: false
      // setHeaders: function(res, path, stat) {
      //   var shortURL = res.req.originalUrl.replace(basePath, '');
      //   // à corriger
      //   if (shortURL.startsWith('build')) {
      //     res.set('Cache-Control', 'public, max-age=31536000');
      //   } else {
      //     res.set('Cache-Control', 'no-cache');
      //   }
      // }
    })
  );

  // Catch all other routes and return the index file
  router.get('*', (req, res) => {
    res.status(200).sendFile(path.join(`${baseFolder}/index.html`));
  });

  return router;
}
var app = express();
app.use(metricsMiddleware);
app.use('/diagnostics/v1', createDiagnosticRouter());
app.use('/agir-planification/', createSpaRouter(appFolder));
app.use('/agir-planification-formation/', createSpaRouter(appFolder));

app.use(function(err, req, res, next) {
  console.error(err.stack);
});

var httpServer = http.createServer(app);
httpServer.listen(httpPort, err => {
  console.log(`Serving '${appFolder} on port ${httpPort}.`);
});
