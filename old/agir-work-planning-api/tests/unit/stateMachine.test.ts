import { IEnrichedProject, InterventionDecisionType, InterventionStatus } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';

import { stateMachine } from '../../src/utils/stateMachine';
import { IApiError } from '../../src/utils/utils';
import { getMinimalInitialIntervention } from '../data/interventionData';
import { getInitialProject } from '../data/projectData';

describe('Test validate transition', () => {
  let project: IEnrichedProject;
  before(() => {
    project = getInitialProject();
  });

  it('Positive - intervention is valid to change status from waiting to refused', () => {
    const intervention = getMinimalInitialIntervention();
    intervention.status = InterventionStatus.waiting;
    intervention.decisions = [
      {
        text: '',
        typeId: InterventionDecisionType.refused
      }
    ];

    const isPossible = stateMachine.isTransitionPossible(intervention, InterventionStatus.refused);
    assert.strictEqual(isPossible, true);
    const errorDetails: IApiError[] = stateMachine.validateToRefused(intervention);
    assert.strictEqual(errorDetails.length, 0);
  });

  it('Positive - intervention is valid to change status from refused to waiting', () => {
    const intervention = getMinimalInitialIntervention();
    intervention.status = InterventionStatus.refused;
    intervention.decisions = [
      {
        text: '',
        typeId: InterventionDecisionType.refused
      }
    ];
    intervention.decisions.push({
      text: '',
      typeId: InterventionDecisionType.revisionRequest
    });

    const isPossible = stateMachine.isTransitionPossible(intervention, InterventionStatus.waiting);
    assert.strictEqual(isPossible, true);
    const errorDetails: IApiError[] = stateMachine.validateToWaiting(intervention);
    assert.strictEqual(errorDetails.length, 0);
  });

  it('Positive - intervention is valid to change status from waiting to accepted', () => {
    const intervention = getMinimalInitialIntervention();
    intervention.status = InterventionStatus.waiting;
    intervention.decisions = [
      {
        text: '',
        typeId: InterventionDecisionType.accepted
      }
    ];

    const isPossible = stateMachine.isTransitionPossible(intervention, InterventionStatus.accepted);
    assert.strictEqual(isPossible, true);
    const errorDetails: IApiError[] = stateMachine.validateToAccepted(intervention);
    assert.strictEqual(errorDetails.length, 0);
  });

  it('Positive - intervention is valid to change status from waiting to integrated', () => {
    const intervention = getMinimalInitialIntervention();
    intervention.status = InterventionStatus.waiting;
    intervention.project = {
      id: project.id
    };
    project.interventions.push(intervention);

    const isPossible = stateMachine.isTransitionPossible(intervention, InterventionStatus.integrated);
    assert.strictEqual(isPossible, true);
    const errorDetails: IApiError[] = stateMachine.validateToIntegrated(intervention, { project });
    assert.strictEqual(errorDetails.length, 0);
  });

  it('C53744 - Negative - intervention is invalid to change status from waiting to integrated', () => {
    const intervention = getMinimalInitialIntervention();
    intervention.status = InterventionStatus.waiting;
    const errorDetails: IApiError[] = stateMachine.validateToIntegrated(intervention, { project });
    assert.strictEqual(errorDetails.length, 1);
  });
});

describe('Test validate regular transitions', () => {
  it('Positive - intervention is valid to change status from null to wished', () => {
    const intervention = getMinimalInitialIntervention();

    const isPossible = stateMachine.isTransitionPossible(intervention, InterventionStatus.wished);
    assert.strictEqual(isPossible, true);
  });

  it('Positive - intervention is valid to change status from null to waiting', () => {
    const intervention = getMinimalInitialIntervention();

    const isPossible = stateMachine.isTransitionPossible(intervention, InterventionStatus.waiting);
    assert.strictEqual(isPossible, true);
  });

  it('Positive - intervention is valid to change status from wished to waiting', () => {
    const intervention = getMinimalInitialIntervention();
    intervention.status = InterventionStatus.wished;

    const isPossible = stateMachine.isTransitionPossible(intervention, InterventionStatus.waiting);
    assert.strictEqual(isPossible, true);
  });

  [
    {
      fromStatus: InterventionStatus.wished
    },
    {
      fromStatus: InterventionStatus.waiting
    },
    {
      fromStatus: InterventionStatus.refused
    },
    {
      fromStatus: InterventionStatus.accepted
    },
    {
      fromStatus: InterventionStatus.integrated
    }
  ].forEach(test => {
    it(`Positive - intervention is valid to change status from ${test.fromStatus} to canceled`, () => {
      const intervention = getMinimalInitialIntervention();
      intervention.status = test.fromStatus;

      const isPossible = stateMachine.isTransitionPossible(intervention, InterventionStatus.canceled);
      assert.strictEqual(isPossible, true);
    });
  });
});
