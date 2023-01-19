import { IAsset, IEnrichedIntervention, IGeometry } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { LengthUnit } from '../../src/features/length/models/length';
import { workLengthService } from '../../src/services/workLengthService';
import { workLengthData } from '../data/workLengthData';

describe('Work length service', () => {
  function getAssetLength(intervention: IEnrichedIntervention) {
    const asset: IAsset = {
      ...intervention.assets.find(a => a),
      roadSections: intervention.roadSections
    };
    const interventionArea: IGeometry = intervention.interventionArea.geometry;
    return workLengthService.getAssetLength(asset, interventionArea);
  }

  describe('Tests getAssetLength', () => {
    describe('Line', () => {
      it('C60687 Positive - Should return lineString length', () => {
        const length = getAssetLength(workLengthData.getLineStringAssetIntervention());
        assert.deepEqual(length, { unit: LengthUnit.meter, value: 32.51933998649007 });
      });
      it('C60688 Positive - Should return multiLineString length', () => {
        const length = getAssetLength(workLengthData.getMultiLineStringAssetIntervention());
        assert.deepEqual(length, { unit: LengthUnit.meter, value: 40.64701274469633 });
      });
    });
    describe('Polygon', () => {
      it('C60689 Positive - Should return road section length inside intervention area if the road section crosses the entire intervention area', () => {
        const length = getAssetLength(workLengthData.getPolygonAssetRoadSectionInsideAreaIntervention());
        assert.deepEqual(length, { unit: LengthUnit.meter, value: 215.65192212919825 });
      });
      it('C60690 Positive - Should return road section length if it intersects the intervention area', () => {
        const length = getAssetLength(workLengthData.getPolygonAssetRoadSectionIntersectingAreaIntervention());
        assert.deepEqual(length, { unit: LengthUnit.meter, value: 64.22086287519569 });
      });
      it('C60691 Positive - Should return road section length if it intersects the intervention area starting from inside it', () => {
        const length = getAssetLength(
          workLengthData.getPolygonAssetRoadSectionIntersectingAreaStartingInsideIntervention()
        );
        assert.deepEqual(length, { unit: LengthUnit.meter, value: 60.186989138779914 });
      });
      it('C60692 Negative - Should return 0 meters if the road section is not contained by the intervention area', () => {
        const length = getAssetLength(workLengthData.getPolygonAssetRoadSectionOutsideIntervention());
        assert.deepEqual(length, { unit: LengthUnit.meter, value: 0 });
      });
    });
    describe('Point', () => {
      it('C60693 Positive - Should return 0 meters as point length', () => {
        const length = getAssetLength(workLengthData.getPointAssetIntervention());
        assert.deepEqual(length, { unit: LengthUnit.meter, value: 0 });
      });
    });
    it('C60694 Positive - Should return intervention area length if the asset is contained in the area', () => {
      const length = getAssetLength(workLengthData.getLineStringAssetInsideAreaIntervention());
      assert.deepEqual(length, { unit: LengthUnit.meter, value: 26.23008952002586 });
    });
    it('C60695 Positive - Should return asset length if it intersects the intervention area', () => {
      const length = getAssetLength(workLengthData.getLineStringAssetIntersectingAreaIntervention());
      assert.deepEqual(length, { unit: LengthUnit.meter, value: 17.102569765572028 });
    });
  });
});
