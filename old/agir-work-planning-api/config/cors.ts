import * as cors from 'cors';
import { Request } from 'express';
import { configs } from './configs';

export function corsOptionsDelegate(req: Request, callback: any) {
  const { whitelist } = configs.security.cors;
  const r = new RegExp(whitelist);
  // const flag = r.test(req.hostname);
  // const allowedOrigin: boolean | string = flag
  //     ? `${req.protocol}://${req.hostname}`
  //     : false;

  const res: cors.CorsOptions = {
    origin: r,
    optionsSuccessStatus: 200, // IE 11 workaround, since 204 fails
    // allowedHeaders: ['Origin', 'Content-Type', 'Content-Length', 'Accept',
    //     'Accept-Language', 'X-Authorization',
    //     'Access-Control-Allow-Headers', 'Access-Control-Allow-Origin',
    //     'x-requested-with', 'Content-Range',
    //     'Content-Disposition', 'Content-Description'
    // ],
    allowedHeaders: [
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Origin',
      'Authorization',
      'Origin',
      'Accept',
      'X-Requested-With',
      'Content-Type',
      'access_token',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'x-auth-token-issuer'
    ],
    // credentials,
    exposedHeaders: ['Authorization', 'Content-Type', 'Accept-Language', 'Origin', 'Location'],
    // maxAge,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    // preflightContinue
  };
  callback(null, res);
}
