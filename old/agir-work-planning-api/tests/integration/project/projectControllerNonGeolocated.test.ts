import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { assert } from 'chai';

import { projectDataGenerator } from '../../data/dataGenerators/projectDataGenerator';
import { projectTestClient } from '../../utils/testClients/projectTestClient';
import { integrationAfter } from '../_init.test';

describe('Project Controller - Non geolocated', () => {
  after(async () => {
    await integrationAfter();
  });

  describe('Create', () => {
    it('C60926  Negative - Should not create a non-geolocated project if the "start year" is greater than the "end year"', async () => {
      const plainProject = projectDataGenerator.createPlainNonGeo({
        startYear: 2020,
        endYear: 2019
      });

      const response = await projectTestClient.create(plainProject);

      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('C60929  Negative - Should not create a non-geolocated project if the budget is not set', async () => {
      const plainProject = projectDataGenerator.createPlainNonGeo({
        globalBudget: null
      });

      const response = await projectTestClient.create(plainProject);

      assert.strictEqual(response.status, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    });
  });
});
