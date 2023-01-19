import { assert } from 'chai';

import { GeometryUtil } from '../../src';
import {
  getIntersectIntervention,
  getInterventionOutOfCShapedProject,
  getMinimalInitialIntervention,
  getOutOfBoundsIntervention
} from '../test/data/interventionData';
import { getCShapedProject, getInitialProject } from '../test/data/projectData';

// ==========================================
// Set Testing configurations
// ==========================================
describe('GeometryUtil tests)', () => {
  describe('validateProjectContainsInterventions() tests)', () => {
    it('Positive - Interventions area are inside project', async () => {
      const list = GeometryUtil.validateProjectContainsIntervention(getInitialProject(), [
        getMinimalInitialIntervention()
      ]);
      assert.deepStrictEqual(list, []);
    });
    it('Negative - One intervention area is not completely inside project', async () => {
      const list = GeometryUtil.validateProjectContainsIntervention(getInitialProject(), [getIntersectIntervention()]);
      assert.deepStrictEqual(list, ['2']);
    });
    it('Negative - One intervention area is out of bounds of project', async () => {
      const list = GeometryUtil.validateProjectContainsIntervention(getInitialProject(), [
        getOutOfBoundsIntervention()
      ]);
      assert.deepStrictEqual(list, ['3']);
    });
    it('Negative - should not contain intervention that has all points in project but bounds are out of it', async () => {
      const intervention = getInterventionOutOfCShapedProject();
      const list = GeometryUtil.validateProjectContainsIntervention(getCShapedProject(), [intervention]);
      assert.deepStrictEqual(list, [intervention.id]);
    });
  });
});
