import { ErrorCodes, IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';

import { interventionValidator } from '../../src/features/interventions/validators/interventionValidator';
import { IApiError } from '../../src/utils/utils';
import { getMinimalInitialIntervention } from '../data/interventionData';

describe('Test validateInterventionYear', () => {
  it('C33400	Positive - interventionYear is int and equal or greater than 2000', () => {
    const intervention: IEnrichedIntervention = getMinimalInitialIntervention();
    intervention.interventionYear = 2000;
    const errorDetail: IApiError = interventionValidator.validatePlannedYear(intervention);
    assert.strictEqual(errorDetail, null);
  });
  it('C33402	Negative - interventionYear is int but less than 2000', () => {
    const intervention: IEnrichedIntervention = getMinimalInitialIntervention();
    intervention.planificationYear = 1999;
    const errorDetail: IApiError = interventionValidator.validatePlannedYear(intervention);
    assert.strictEqual(errorDetail.target, 'planificationYear');
  });
});
describe('Test validateProgram', () => {
  it('C33403	Positive - Intervention has a programId', () => {
    const intervention: IEnrichedIntervention = getMinimalInitialIntervention();
    const errorDetail: IApiError = interventionValidator.validateProgram(intervention);
    assert.strictEqual(errorDetail, null);
  });
  it("C33404	Negative - Intervention's programId is null", () => {
    const intervention: IEnrichedIntervention = getMinimalInitialIntervention();
    intervention.programId = null;
    const errorDetail: IApiError = interventionValidator.validateProgram(intervention);
    assert.strictEqual(errorDetail.target, 'programId');
  });
  it("C33405	Negative - Intervention's programId is empty", () => {
    const intervention: IEnrichedIntervention = getMinimalInitialIntervention();
    intervention.programId = '';
    const errorDetail: IApiError = interventionValidator.validateProgram(intervention);
    assert.strictEqual(errorDetail.target, 'programId');
  });
});

describe('Test validateAssetsInIntervention', () => {
  it('Positive - Asset within the intervention zone', async () => {
    const intervention: IEnrichedIntervention = getMinimalInitialIntervention();
    const errorDetail: any = [];
    interventionValidator.validateAssetsInIntervention(errorDetail, intervention);

    assert.strictEqual(errorDetail.length, 0);
  });

  it('Negative - Asset NOT within the intervention zone', async () => {
    const intervention: IEnrichedIntervention = getMinimalInitialIntervention();

    // set asset geometry  outside of the intervention
    intervention.assets[0].geometry = {
      type: 'Point',
      coordinates: [-73.65437150001526, 45.52655083612423]
    };
    const errorDetail: any = [];

    interventionValidator.validateAssetsInIntervention(errorDetail, intervention);

    assert.strictEqual(errorDetail[0].code, ErrorCodes.InterventionAsset);
  });
});
