import { feature, MultiPolygon, Polygon } from '@turf/turf';
import { IGeometry } from '@villemontreal/agir-work-planning-lib';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import * as HttpStatusCodes from 'http-status-codes';

import { interventionService } from '../features/interventions/interventionService';
import { assetService } from '../services/assetService';
import { projectWorkAreaService } from '../services/projectWorkAreaService';
import { spatialAnalysisService } from '../services/spatialAnalysisService';
import { workAreaService } from '../services/workAreaService';

/**
 * Search controller
 *
 * Part of the "Mongo/Mongoose examples" provided by the generator.
 *
 * The "@autobind" decorator automatically binds all the methods of
 * the class to the proper "this" value. When a route is executed,
 * the receiving method of the controller must be properly bound or
 * "this" will not represent the controller instance.
 * @see https://github.com/andreypopp/autobind-decorator
 */
@autobind
export class SearchController {
  public async getWorkAreaByGeometry(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    if (req.query.type === 'project') {
      await this.generateProjectWorkArea(req, res, next);
    } else {
      await this.generateInterventionWorkArea(req, res, next);
    }
  }

  private async generateProjectWorkArea(
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ): Promise<void> {
    const polygons: Polygon[] = req.body.filter((p: any) => p.type === 'Polygon');
    const multiPolygons: MultiPolygon[] = req.body.filter((p: any) => p.type === 'MultiPolygon');

    multiPolygons.forEach((mp: MultiPolygon) => {
      const features = spatialAnalysisService.multiPolygonToPolygons(feature(mp));
      features.forEach(f => {
        polygons.push(f.geometry);
      });
    });

    // Validate input
    await projectWorkAreaService.validatePolygons(polygons);

    // Retrieve work area
    const workArea = await projectWorkAreaService.generateWorkArea(polygons);

    res.status(HttpStatusCodes.OK).send(workArea);
  }

  private async generateInterventionWorkArea(
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ): Promise<void> {
    const inputGeometries: IGeometry[] = Array.isArray(req.body) ? req.body : [req.body];

    // Validate input
    interventionService.validateWorkAreaInput(inputGeometries);

    const workArea = await workAreaService.getWorkAreaFromGeometries(inputGeometries);
    if (workArea && workArea.properties) {
      const roadSections = await assetService.getRoadSections(workArea);
      workArea.properties.suggestedStreetName = spatialAnalysisService.getSuggestedName(roadSections);
    }

    res.status(HttpStatusCodes.OK).send(workArea);
  }
}
export const searchController: SearchController = new SearchController();
