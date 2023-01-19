import {
  IAsset,
  IBudget,
  IEnrichedIntervention,
  IInterventionAnnualDistribution,
  IPlainIntervention
} from '../../planning';

export function getEnrichedIntervention(): IEnrichedIntervention {
  const intervention = {
    ...getMinimalInitialIntervention(),
    audit: {
      createdBy: { userName: 'test', displayName: 'Test' }
    }
  } as IEnrichedIntervention;
  intervention.annualDistribution = getInterventionAnnualDistribution();
  intervention.estimate = getInterventionEstimate();
  return intervention;
}

export function getInterventionEstimate(): IBudget {
  return { allowance: 4000, burnedDown: 0, balance: 4000 };
}

export function getInterventionAnnualDistribution(): IInterventionAnnualDistribution {
  return {
    distributionSummary: { totalLength: 0, totalAllowance: 0 },
    annualPeriods: [
      { year: 2021, annualAllowance: 2000 },
      { year: 2022, annualAllowance: 2000 }
    ]
  };
}

export function getInterventionAsset(): IAsset {
  return {
    id: 'R145',
    typeId: 'fireHydrant',
    ownerId: 'dep',
    length: {
      unit: 'm',
      value: 4
    },
    geometry: {
      type: 'Point',
      coordinates: [-73.55547, 45.495622]
    }
  };
}

// tslint:disable-next-line:max-func-body-length
export function getMinimalInitialIntervention(): IPlainIntervention {
  const intervention: IPlainIntervention = {
    id: '1',
    interventionName: 'interventionName',
    interventionTypeId: 'intervention',
    workTypeId: 'reconstruction',
    requestorId: 'P1',
    boroughId: 'VM',
    status: null,
    interventionYear: 2021,
    planificationYear: 2021,
    estimate: 10,
    executorId: 'di',
    contact: 'test',
    assets: [getInterventionAsset()],
    interventionArea: {
      isEdited: false,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-73.6530303955078, 45.475540271585906],
            [-73.58917236328124, 45.475540271585906],
            [-73.58917236328124, 45.51380534702895],
            [-73.6530303955078, 45.51380534702895],
            [-73.6530303955078, 45.475540271585906]
          ]
        ]
      }
    },
    roadSections: {
      type: 'FeatureCollection',
      features: [
        {
          geometry: {
            type: 'LineString',
            coordinates: [
              [-73.553554, 45.49549],
              [-73.554326, 45.495778]
            ]
          },
          properties: {
            id: 1030565,
            name: 'rue Duke',
            fromName: 'rue Wellington',
            toName: 'rue De la commune',
            scanDirection: 1,
            classification: 0
          },
          type: 'Feature',
          id: '32670'
        },
        {
          geometry: {
            type: 'LineString',
            coordinates: [
              [-73.55561256408691, 45.49636066013693],
              [-73.55552673339844, 45.49687204682633]
            ]
          },
          properties: {
            id: 1030565,
            name: 'rue Wellington',
            fromName: 'rue Prince',
            toName: 'rue Duke',
            scanDirection: 1,
            classification: 0
          },
          type: 'Feature',
          id: '32670'
        }
      ]
    }
  };
  return intervention;
}

/**
 * Changes minimal intervention to have a geometry that intersects current project (ProjectData)
 */
export function getIntersectIntervention(): IPlainIntervention {
  const intervention: IPlainIntervention = getMinimalInitialIntervention();
  intervention.id = '2';
  Object.assign(intervention.interventionArea.geometry.coordinates, [
    [
      [-73.63655090332031, 45.51693278828882],
      [-73.58505249023438, 45.51693278828882],
      [-73.58505249023438, 45.56117947133065],
      [-73.63655090332031, 45.56117947133065],
      [-73.63655090332031, 45.51693278828882]
    ]
  ]);
  return intervention;
}

/**
 * Changes minimal intervention to have a geometry that is out of bounds of current project (ProjectData)
 */
export function getOutOfBoundsIntervention(): IPlainIntervention {
  const intervention: IPlainIntervention = getMinimalInitialIntervention();
  intervention.id = '3';
  Object.assign(intervention.interventionArea.geometry.coordinates, [
    [
      [-73.64067077636719, 45.5864133334758],
      [-73.57337951660156, 45.5864133334758],
      [-73.57337951660156, 45.61908033964834],
      [-73.64067077636719, 45.61908033964834],
      [-73.64067077636719, 45.5864133334758]
    ]
  ]);
  return intervention;
}

/**
 * Creates a PlainIntervention with specified attribute to add variation
 * between created PlainIntervention
 * @param attributes attributes that exists in a PlainIntervention
 */
export function createInterventionModel(attributes: any): IPlainIntervention {
  const interventionModel: IPlainIntervention = getMinimalInitialIntervention();
  Object.assign(interventionModel, attributes);
  return interventionModel;
}

/**
 * Creates a list of PlainIntervention to insert for testing
 */
export function createInterventionList(): IPlainIntervention[] {
  const list: IPlainIntervention[] = [];
  list.push(createInterventionModel({ boroughId: 'SAME', status: 'done' }));
  return list;
}

/**
 * Creates a list of PlainIntervention ordered by InterventionType And Status
 */
export function interventionListOrderdByInterventionTypeAndStatus(): IPlainIntervention[] {
  const list: IPlainIntervention[] = [];
  list.push(createInterventionModel({ boroughId: 'SAME', status: 'open' }));
  list.push(createInterventionModel({ boroughId: 'SAME', status: 'open' }));
  list.push(createInterventionModel({ programId: '2999', status: 'new' }));
  list.push(createInterventionModel({ programId: '5757', status: 'new' }));
  list.push(createInterventionModel({ programId: '1234', status: 'new' }));
  list.push(createInterventionModel({ programId: '2134', status: 'new' }));
  list.push(createInterventionModel({ boroughId: 'SAME', status: 'done' }));
  list.push(createInterventionModel({ boroughId: 'SAME', status: 'done' }));
  list.push(createInterventionModel({ boroughId: 'SAME', status: 'done' }));
  return list;
}

/**
 * Creates a plain intervention that has a basic geometry.
 * (intended to be used with the CShaped project).
 */
export function getInterventionOutOfCShapedProject(): IPlainIntervention {
  const intervention: IPlainIntervention = getMinimalInitialIntervention();
  intervention.id = 'cshaped';
  Object.assign(intervention.interventionArea.geometry.coordinates, [
    [
      [-73.75448226928711, 45.470431782700636],
      [-73.75455737113953, 45.468189619278206],
      [-73.75310897827147, 45.46817457090023],
      [-73.75315189361572, 45.47059730800854],
      [-73.75448226928711, 45.470431782700636]
    ]
  ]);
  return intervention;
}
