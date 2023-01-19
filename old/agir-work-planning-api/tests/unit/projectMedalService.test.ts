import { IEnrichedIntervention, MedalType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { projectMedalService } from '../../src/services/projectMedalService';
import { getMinimalInitialIntervention } from '../data/interventionData';
import { getInitialProject } from '../data/projectData';
import { integrationAfter } from '../integration/_init.test';

describe('projectMedalService > setMedalToProject', () => {
  after(async () => {
    await integrationAfter();
  });

  it('C63389 - Positive - Should assign project medalId to undefined when project contains no intervention', async () => {
    const project = getInitialProject();
    assert.notProperty(project, 'medalId', '1');
    await projectMedalService.setMedalToProject(project, []);
    assert.isNull(project.medalId, '2');
  });

  it('C63390 - Positive - Should assign project medalId to intervention medalId when project contains one intervention', async () => {
    const project = getInitialProject();
    assert.notProperty(project, 'medalId');
    const intervention = getMinimalInitialIntervention();
    for (const medaltype of Object.values(MedalType)) {
      intervention.medalId = medaltype;
      await projectMedalService.setMedalToProject(project, [intervention]);
      assert.equal(project.medalId, intervention.medalId);
    }
  });

  it('C63391 - Positive - Should assign the intervention highest weight medalId to project medalId', async () => {
    const project = getInitialProject();
    assert.notProperty(project, 'medalId');
    const interventions: IEnrichedIntervention[] = [];
    interventions.push(Object.assign({}, getMinimalInitialIntervention(), { medalId: MedalType.platinum }));
    interventions.push(Object.assign({}, getMinimalInitialIntervention(), { medalId: MedalType.bronze }));
    await projectMedalService.setMedalToProject(project, interventions);
    assert.equal(project.medalId, MedalType.platinum);
  });
});
