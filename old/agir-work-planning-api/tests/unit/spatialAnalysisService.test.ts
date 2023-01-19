import { IEnrichedIntervention, IFeature, IPlainIntervention } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as sinon from 'sinon';

import { spatialAnalysisService } from '../../src/services/spatialAnalysisService';
import { workAreaService } from '../../src/services/workAreaService';
import { geometriesSet } from '../data/assets/work-area';
import { getCompleteEnrichedIntervention } from '../data/interventionData';
import {
  iConfigurationGeometryMock,
  iConfigurationGetFeatureResponseMock,
  tConfigurationGeometryMock,
  tConfigurationGetFeatureResponseMock,
  uConfigurationGeometryMock,
  uConfigurationGetFeatureResponseMock
} from '../data/spatialAnalysisData';
import { spatialAnalysisServiceStub } from '../utils/stub/spatialAnalysisService.stub';

const sandbox = sinon.createSandbox();

describe('SpatialAnalysisService', () => {
  let mockIntervention: IPlainIntervention | IEnrichedIntervention;

  before(() => {
    mockIntervention = getCompleteEnrichedIntervention();
  });

  beforeEach(() => {
    sandbox.restore();
    sandbox.stub(spatialAnalysisService, 'getBorough').returns(Promise.resolve({ id: 'SO', name: 'Sud-Ouest' }));
  });

  describe('Borough', () => {
    it('C42584 - Positive - Should get borough', async () => {
      const filter = await spatialAnalysisService.getBorough(mockIntervention.assets[0].geometry);
      assert.deepEqual(filter, { id: 'SO', name: 'Sud-Ouest' });
    });
  });

  describe('Nearest Feature', () => {
    it('C42585 - Positive - Should get the nearest point feature', () => {
      const pointFeature: IFeature = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [-73.67130696773528, 45.543441394367086]
        }
      };

      const feature = spatialAnalysisService.nearestFeature(pointFeature, geometriesSet.features as any);
      const expectedFeature = geometriesSet.features.find(x => (x.properties as any).id === '60285');
      assert.equal(feature, expectedFeature as any);
    });
  });

  describe('Analysis - Suggested main street', () => {
    beforeEach(() => {
      sandbox.restore();
    });

    it('C64739 - Positive - Should generate suggested main street that intersect the most with I area configuration', async () => {
      spatialAnalysisServiceStub.initWfsServiceIntersectStub(sandbox, iConfigurationGetFeatureResponseMock);
      const simplifiedworkArea = workAreaService.simplifyWorkArea(iConfigurationGeometryMock);
      assert.deepEqual(simplifiedworkArea, iConfigurationGeometryMock);
      const spatialAnalysisResponse = await spatialAnalysisService.generateSpatialAnalysisResponse(simplifiedworkArea);
      assert.strictEqual(spatialAnalysisService.generateStreetName(spatialAnalysisResponse), 'Portage');
      assert.strictEqual(spatialAnalysisService.generateStreetFrom(spatialAnalysisResponse), 'Chénier');
      assert.strictEqual(spatialAnalysisService.generateStreetTo(spatialAnalysisResponse), 'Curé-Clermont');
    });

    it('C64740 - Positive - Should generate suggested main street that intersect the most with T area configuration', async () => {
      spatialAnalysisServiceStub.initWfsServiceIntersectStub(sandbox, tConfigurationGetFeatureResponseMock);
      const simplifiedworkArea = workAreaService.simplifyWorkArea(tConfigurationGeometryMock);
      assert.deepEqual(simplifiedworkArea, tConfigurationGeometryMock);
      const spatialAnalysisResponse = await spatialAnalysisService.generateSpatialAnalysisResponse(simplifiedworkArea);
      assert.strictEqual(spatialAnalysisService.generateStreetName(spatialAnalysisResponse), 'Émile-Legrand');
      assert.strictEqual(spatialAnalysisService.generateStreetFrom(spatialAnalysisResponse), 'Marseille');
      assert.strictEqual(spatialAnalysisService.generateStreetTo(spatialAnalysisResponse), 'Sherbrooke');
    });

    it('C64741 - Positive - Should generate suggested main street that intersect the most with U area configuration', async () => {
      spatialAnalysisServiceStub.initWfsServiceIntersectStub(sandbox, uConfigurationGetFeatureResponseMock);
      const simplifiedworkArea = workAreaService.simplifyWorkArea(uConfigurationGeometryMock);
      assert.deepEqual(simplifiedworkArea, uConfigurationGeometryMock);
      const spatialAnalysisResponse = await spatialAnalysisService.generateSpatialAnalysisResponse(simplifiedworkArea);
      assert.strictEqual(spatialAnalysisService.generateStreetName(spatialAnalysisResponse), 'Fougeray');
      assert.strictEqual(spatialAnalysisService.generateStreetFrom(spatialAnalysisResponse), 'Argenton');
      assert.strictEqual(spatialAnalysisService.generateStreetTo(spatialAnalysisResponse), 'Fougeray');
    });
  });
});
