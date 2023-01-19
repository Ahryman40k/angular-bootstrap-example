// tslint:disable: no-async-without-await
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import * as promClient from 'prom-client';

import { configs } from '../../../config/configs';
import { constants } from '../../../config/constants';
import { IDiagnosticsInfo } from '../../models/core/diagnosticsInfo';

let diagnosticsInfo: IDiagnosticsInfo;

/**
 * Diagnostics controller
 */
@autobind
export class DiagnosticsController {
  /**
   * Ping
   */
  public async ping(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    res.contentType(constants.mediaTypes.PLAIN_TEXT);
    res.send('pong');
  }

  /**
   * Info
   */
  public async info(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    if (!diagnosticsInfo) {
      const packageJson = require(`${configs.root}/package.json`);
      diagnosticsInfo = {
        name: packageJson.name,
        description: packageJson.description,
        version: packageJson.version
      };
    }

    res.send(diagnosticsInfo);
  }

  /**
   * Metrics
   */
  public async metrics(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    res.writeHead(200, { 'Content-Type': constants.mediaTypes.PLAIN_TEXT });
    res.end(promClient.register.metrics());
  }

  /**
   * Health Check
   */
  public async healthCheck(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    res.sendStatus(200);
  }

  /**
   * Health Report
   */
  public async healthReport(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    res.status(200).send({});
  }
}
export const diagnosticsController: DiagnosticsController = new DiagnosticsController();
