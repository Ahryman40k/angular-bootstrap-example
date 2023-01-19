// tslint:disable: no-async-without-await
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import * as promClient from 'prom-client';

import { configs } from '../../../config/configs';
import { EndpointTypes } from '../../../config/constants';
import { appUtils } from '../../utils/utils';

/**
 * Dev/Info controller
 */
@autobind
export class DevController {
  /**
   * Index page / General info
   */
  public async index(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const vars = { isGeneralInfoPage: true };
    this.addCommonVars(vars);
    res.render('generalInfo', vars);
  }

  /**
   * Open API info page
   */
  public async openAPI(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const openApiSpecsUrl = appUtils.createPublicUrl(
      configs.routing.routes.openAPI.specsFile,
      EndpointTypes.DOCUMENTATION
    );
    const swaggerUiUrl = appUtils.createPublicUrl(configs.routing.routes.openAPI.ui, EndpointTypes.DOCUMENTATION);
    const swaggerEditorsUrl = appUtils.createPublicUrl(
      configs.routing.routes.openAPI.editor,
      EndpointTypes.DOCUMENTATION
    );
    const vars = {
      openApiSpecsUrl,
      swaggerUiUrl,
      swaggerEditorsUrl,
      isOpenAPIPage: true
    };
    this.addCommonVars(vars);
    res.render('openAPI', vars);
  }

  /**
   * Health info page
   */
  public async health(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const vars = {
      isHealthPage: true,
      pingUrl: appUtils.createPublicUrl(configs.routing.routes.diagnostics.ping, EndpointTypes.DIAGNOSTICS),
      infoUrl: appUtils.createPublicUrl(configs.routing.routes.diagnostics.info, EndpointTypes.DIAGNOSTICS)
    };
    this.addCommonVars(vars);
    res.render('health', vars);
  }

  /**
   * Metrics info page
   */
  public async metrics(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(promClient.register.metrics());
  }

  /**
   * Readme info page
   */
  public async readme(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const vars = {
      isReadmePage: true,
      readmeContent: appUtils.getReadmeHtml()
    };
    this.addCommonVars(vars);
    res.render('readme', vars);
  }

  /**
   * Adds common variables for all info pages.
   */
  protected addCommonVars(vars: any) {
    vars.publicRoot = appUtils.createPublicFullPath('/public', EndpointTypes.NONE);

    const packageJson = require(`${configs.root}/package.json`);
    vars.projectName = packageJson.name;
    vars.projectDescription = packageJson.description;
    vars.projectVersion = packageJson.version;

    vars.configs = configs;
    vars.infoJsonUrl = appUtils.createPublicUrl(configs.routing.routes.diagnostics.info, EndpointTypes.DIAGNOSTICS);
  }
}
export const devController: DevController = new DevController();
