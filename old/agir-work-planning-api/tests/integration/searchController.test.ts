import * as turf from '@turf/turf';
import { assert } from 'chai';
import { Express } from 'express';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import * as HttpStatusCodes from 'http-status-codes';
import * as sinon from 'sinon';
import * as request from 'supertest';

import { constants, EndpointTypes } from '../../config/constants';
import { createDefaultApp } from '../../src/core/app';
import { spatialAnalysisService } from '../../src/services/spatialAnalysisService';
import { AnalysisLayerIds } from '../../src/services/spatialAnalysisService/spatialAnalysisEnum';
import { appUtils } from '../../src/utils/utils';
import { getBadPolygon } from '../data/assetData';
import {
  projectWorkAreaMultiplePolygonsResult,
  projectWorkAreaMultiPolygon,
  projectWorkAreaPavementsWfsResult,
  projectWorkAreaPolygon1,
  projectWorkAreaPolygon2,
  projectWorkAreaRoadSectionsWfsResult,
  projectWorkAreaSinglePolygonResult
} from '../data/assets/work-area';
import { integrationAfter } from './_init.test';

// tslint:disable:max-func-body-length
describe('Search controller', () => {
  let testApp: Express;

  before(async () => {
    testApp = await createDefaultApp();
  });

  after(async () => {
    await integrationAfter();
  });

  describe('search assets > POST', () => {
    const apiSearchUrl: string = appUtils.createPublicFullPath(
      constants.locationPaths.SEARCHWORKAREA,
      EndpointTypes.API
    );
    before(() => {
      sinon
        .stub(spatialAnalysisService, 'getLayerNearbyFeatures')
        .withArgs(sinon.match.any, AnalysisLayerIds.pavementSections, AnalysisLayerIds.intersections)
        .resolves(projectWorkAreaPavementsWfsResult)
        .withArgs(sinon.match.any, AnalysisLayerIds.roadSections)
        .resolves(projectWorkAreaRoadSectionsWfsResult);
    });
    after(() => {
      sinon.restore();
    });

    it('C47260 - Positive - Should return a surfacique geometry using a input 90 degrees form geometry', async () => {
      const inputGeometries = [projectWorkAreaPolygon1, projectWorkAreaPolygon2];
      const response = await request(testApp)
        .post(`${apiSearchUrl}?type=project`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(inputGeometries);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isTrue(turf.booleanEqual(response.body.geometry, projectWorkAreaMultiplePolygonsResult.geometry));
    });

    it('Positive - Should return a surfacique geometry using a multi polygon', async () => {
      const inputGeometries = [projectWorkAreaMultiPolygon];
      const response = await request(testApp)
        .post(`${apiSearchUrl}?type=project`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(inputGeometries);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isTrue(turf.booleanEqual(response.body.geometry, projectWorkAreaMultiplePolygonsResult.geometry));
    });

    it('C47261 - Negative - Should return the same geometry when not surfacique geometry founds', async () => {
      const inputGeometries = [projectWorkAreaPolygon1];
      const response = await request(testApp)
        .post(`${apiSearchUrl}?type=project`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(inputGeometries);
      assert.strictEqual(response.status, HttpStatusCodes.OK);
      assert.isTrue(turf.booleanEqual(response.body, projectWorkAreaSinglePolygonResult));
    });

    it('C47262 Negative - Should have status 400 with a message : "invalid request"l when empty body geometry', async () => {
      const response = await request(testApp)
        .post(`${apiSearchUrl}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send();
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });

    it('C47263 Negative - Should have status 400 with a message : "invalid request" when bad body geometry', async () => {
      const response = await request(testApp)
        .post(`${apiSearchUrl}`)
        .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
        .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
        .send(getBadPolygon());
      assert.strictEqual(response.status, HttpStatusCodes.BAD_REQUEST);
    });
  });
});
