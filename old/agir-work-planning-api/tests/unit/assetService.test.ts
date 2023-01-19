import * as turf from '@turf/turf';
import { IFeature } from '@villemontreal/agir-work-planning-lib';
import * as assert from 'assert';

import { assetService } from '../../src/services/assetService';
import { geometriesSet, intersectionResult2, streetResult } from '../data/assets/work-area';

describe('Assets - Units', () => {
  describe('Work Area', () => {
    const features = geometriesSet.features as IFeature[];

    it('C42586  Positive - Should combine the roads', () => {
      const roadSectionFeature = features.find(x => x.properties.id === '60285') as IFeature;

      // tslint:disable-next-line: no-string-literal
      const result = assetService['combineWorkAreaFeatures']([roadSectionFeature], features);
      assert.deepEqual(result.geometry, streetResult);
    });

    it('C42587  Positive - Should combine the intersections', () => {
      const intersectionFeature = features.find(x => x.properties.id === 230132223) as IFeature;

      // tslint:disable-next-line: no-string-literal
      const result = assetService['combineWorkAreaFeatures']([intersectionFeature], features);
      assert.equal(
        turf.booleanEqual(
          turf.polygon((result.geometry as any).coordinates),
          turf.polygon(intersectionResult2.coordinates as any)
        ),
        true
      );
    });
  });
});
