import { IEnrichedIntervention, IGeometry } from '@villemontreal/agir-work-planning-lib/dist/src';

import { getAssetProps } from '../../src/features/asset/tests/assetTestHelper';
import { EXECUTOR_DI } from '../../src/shared/taxonomies/constants';
import { appUtils } from '../../src/utils/utils';
import { createAuthorMock } from './author.mocks';
import { interventionDataAssetForTest } from './interventionData';

const workLengthDataGeometryPointForTest: IGeometry = {
  type: 'Point',
  coordinates: [-73.6283004283905, 45.528411112801116]
};

const workLengthDataGeometryPolygonForTest: IGeometry = {
  type: 'Polygon',
  coordinates: [
    [
      [-73.62857937812805, 45.52861404835311],
      [-73.62868666648865, 45.52850882260273],
      [-73.62849354743958, 45.52847875806646],
      [-73.62841844558716, 45.528583983873105],
      [-73.62857937812805, 45.52861404835311]
    ]
  ]
};

const workLengthDataGeometryMultiLineStringForTest: IGeometry = {
  type: 'MultiLineString',
  coordinates: [
    [
      [-73.62879395484924, 45.52879443489585],
      [-73.62897634506226, 45.528531370994386]
    ],
    [
      [-73.62748503684998, 45.528140530926166],
      [-73.62719535827637, 45.52820817651692]
    ]
  ]
};

const workLengthDataGeometryLineString73ForTest: IGeometry = {
  type: 'LineString',
  coordinates: [
    [-73.6270022392273, 45.52833595129973],
    [-73.62669110298155, 45.52824575736554]
  ]
};

const workLengthDataGeometryLineString13ForTest: IGeometry = {
  type: 'LineString',
  coordinates: [
    [-73.6272382736206, 45.52862908058713],
    [-73.62720608711243, 45.52829837051139]
  ]
};

const workLengthDataGeometryLineString85ForTest: IGeometry = {
  type: 'LineString',
  coordinates: [
    [-73.62879395484924, 45.52879443489585],
    [-73.62897634506226, 45.528531370994386]
  ]
};

class WorkLengthData {
  public getPointAssetIntervention(): IEnrichedIntervention {
    const intervention: IEnrichedIntervention = {
      interventionName: 'interventionName',
      interventionTypeId: 'initialNeed',
      workTypeId: 'reconstruction',
      requestorId: 'borough',
      executorId: EXECUTOR_DI,
      boroughId: 'VM',
      programId: 'pcpr',
      interventionYear: appUtils.getCurrentYear(),
      planificationYear: appUtils.getCurrentYear(),
      status: null,
      estimate: { allowance: 10, burnedDown: 0, balance: 10 },
      contact: 'test',
      assets: [getAssetProps({ ...interventionDataAssetForTest, geometry: workLengthDataGeometryPointForTest })],
      interventionArea: {
        isEdited: false,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-73.62899780273438, 45.52897482086003],
              [-73.62918019294739, 45.52872679001011],
              [-73.62661600112915, 45.52799020709987],
              [-73.6264443397522, 45.52822320885938],
              [-73.62899780273438, 45.52897482086003]
            ]
          ]
        },
        geometryPin: [-73.62788200378418, 45.528471241929886]
      },
      roadSections: {
        type: 'FeatureCollection',
        features: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [-73.62971663475037, 45.529057497566974],
                [-73.62597227096558, 45.52793759366575]
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
          }
        ]
      },
      audit: {
        createdBy: createAuthorMock()
      }
    };
    return intervention;
  }

  public getLineStringAssetInsideAreaIntervention(): IEnrichedIntervention {
    const intervention: IEnrichedIntervention = {
      interventionName: 'interventionName',
      interventionTypeId: 'initialNeed',
      workTypeId: 'reconstruction',
      requestorId: 'borough',
      executorId: EXECUTOR_DI,
      boroughId: 'VM',
      programId: 'pcpr',
      interventionYear: appUtils.getCurrentYear(),
      planificationYear: appUtils.getCurrentYear(),
      status: null,
      estimate: { allowance: 10, burnedDown: 0, balance: 10 },
      contact: 'test',
      assets: [getAssetProps({ ...interventionDataAssetForTest, geometry: workLengthDataGeometryLineString73ForTest })],
      interventionArea: {
        isEdited: false,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-73.62899780273438, 45.52897482086003],
              [-73.62918019294739, 45.52872679001011],
              [-73.62661600112915, 45.52799020709987],
              [-73.6264443397522, 45.52822320885938],
              [-73.62899780273438, 45.52897482086003]
            ]
          ]
        },
        geometryPin: [-73.62788200378418, 45.528471241929886]
      },
      roadSections: {
        type: 'FeatureCollection',
        features: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [-73.62971663475037, 45.529057497566974],
                [-73.62597227096558, 45.52793759366575]
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
          }
        ]
      },
      audit: {
        createdBy: createAuthorMock()
      }
    };
    return intervention;
  }

  public getLineStringAssetIntersectingAreaIntervention(): IEnrichedIntervention {
    const intervention: IEnrichedIntervention = {
      interventionName: 'interventionName',
      interventionTypeId: 'initialNeed',
      workTypeId: 'reconstruction',
      requestorId: 'borough',
      executorId: EXECUTOR_DI,
      boroughId: 'VM',
      programId: 'pcpr',
      interventionYear: appUtils.getCurrentYear(),
      planificationYear: appUtils.getCurrentYear(),
      status: null,
      estimate: { allowance: 10, burnedDown: 0, balance: 10 },
      contact: 'test',
      assets: [getAssetProps({ ...interventionDataAssetForTest, geometry: workLengthDataGeometryLineString13ForTest })],
      interventionArea: {
        isEdited: false,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-73.62899780273438, 45.52897482086003],
              [-73.62918019294739, 45.52872679001011],
              [-73.62661600112915, 45.52799020709987],
              [-73.6264443397522, 45.52822320885938],
              [-73.62899780273438, 45.52897482086003]
            ]
          ]
        },
        geometryPin: [-73.62788200378418, 45.528471241929886]
      },
      roadSections: {
        type: 'FeatureCollection',
        features: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [-73.62971663475037, 45.529057497566974],
                [-73.62597227096558, 45.52793759366575]
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
          }
        ]
      },
      audit: {
        createdBy: createAuthorMock()
      }
    };
    return intervention;
  }

  public getLineStringAssetIntervention(): IEnrichedIntervention {
    const intervention: IEnrichedIntervention = {
      interventionName: 'interventionName',
      interventionTypeId: 'initialNeed',
      workTypeId: 'reconstruction',
      requestorId: 'borough',
      executorId: EXECUTOR_DI,
      boroughId: 'VM',
      programId: 'pcpr',
      interventionYear: appUtils.getCurrentYear(),
      planificationYear: appUtils.getCurrentYear(),
      status: null,
      estimate: { allowance: 10, burnedDown: 0, balance: 10 },
      contact: 'test',
      assets: [getAssetProps({ ...interventionDataAssetForTest, geometry: workLengthDataGeometryLineString85ForTest })],
      interventionArea: {
        isEdited: false,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-73.62899780273438, 45.52897482086003],
              [-73.62918019294739, 45.52872679001011],
              [-73.62661600112915, 45.52799020709987],
              [-73.6264443397522, 45.52822320885938],
              [-73.62899780273438, 45.52897482086003]
            ]
          ]
        },
        geometryPin: [-73.62788200378418, 45.528471241929886]
      },
      roadSections: {
        type: 'FeatureCollection',
        features: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [-73.62971663475037, 45.529057497566974],
                [-73.62597227096558, 45.52793759366575]
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
          }
        ]
      },
      audit: {
        createdBy: createAuthorMock()
      }
    };
    return intervention;
  }

  public getMultiLineStringAssetIntervention(): IEnrichedIntervention {
    const intervention: IEnrichedIntervention = {
      interventionName: 'interventionName',
      interventionTypeId: 'initialNeed',
      workTypeId: 'reconstruction',
      requestorId: 'borough',
      executorId: 'di',
      boroughId: 'VM',
      programId: 'pcpr',
      interventionYear: appUtils.getCurrentYear(),
      planificationYear: appUtils.getCurrentYear(),
      status: null,
      estimate: { allowance: 10, burnedDown: 0, balance: 10 },
      contact: 'test',
      assets: [
        getAssetProps({ ...interventionDataAssetForTest, geometry: workLengthDataGeometryMultiLineStringForTest })
      ],
      interventionArea: {
        isEdited: false,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-73.62899780273438, 45.52897482086003],
              [-73.62918019294739, 45.52872679001011],
              [-73.62661600112915, 45.52799020709987],
              [-73.6264443397522, 45.52822320885938],
              [-73.62899780273438, 45.52897482086003]
            ]
          ]
        },
        geometryPin: [-73.62788200378418, 45.528471241929886]
      },
      roadSections: {
        type: 'FeatureCollection',
        features: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [-73.62971663475037, 45.529057497566974],
                [-73.62597227096558, 45.52793759366575]
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
          }
        ]
      },
      audit: {
        createdBy: createAuthorMock()
      }
    };
    return intervention;
  }

  public getPolygonAssetRoadSectionInsideAreaIntervention(): IEnrichedIntervention {
    const intervention: IEnrichedIntervention = {
      interventionName: 'interventionName',
      interventionTypeId: 'initialNeed',
      workTypeId: 'reconstruction',
      requestorId: 'borough',
      executorId: EXECUTOR_DI,
      boroughId: 'VM',
      programId: 'pcpr',
      interventionYear: appUtils.getCurrentYear(),
      planificationYear: appUtils.getCurrentYear(),
      status: null,
      estimate: { allowance: 10, burnedDown: 0, balance: 10 },
      contact: 'test',
      assets: [getAssetProps({ ...interventionDataAssetForTest, geometry: workLengthDataGeometryPolygonForTest })],
      interventionArea: {
        isEdited: false,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-73.62899780273438, 45.52897482086003],
              [-73.62918019294739, 45.52872679001011],
              [-73.62661600112915, 45.52799020709987],
              [-73.6264443397522, 45.52822320885938],
              [-73.62899780273438, 45.52897482086003]
            ]
          ]
        },
        geometryPin: [-73.62788200378418, 45.528471241929886]
      },
      roadSections: {
        type: 'FeatureCollection',
        features: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [-73.62971663475037, 45.529057497566974],
                [-73.62597227096558, 45.52793759366575]
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
          }
        ]
      },
      audit: {
        createdBy: createAuthorMock()
      }
    };
    return intervention;
  }

  public getPolygonAssetRoadSectionIntersectingAreaIntervention(): IEnrichedIntervention {
    const intervention: IEnrichedIntervention = {
      interventionName: 'interventionName',
      interventionTypeId: 'initialNeed',
      workTypeId: 'reconstruction',
      requestorId: 'borough',
      executorId: EXECUTOR_DI,
      boroughId: 'VM',
      programId: 'pcpr',
      interventionYear: appUtils.getCurrentYear(),
      planificationYear: appUtils.getCurrentYear(),
      status: null,
      estimate: { allowance: 10, burnedDown: 0, balance: 10 },
      contact: 'test',
      assets: [getAssetProps({ ...interventionDataAssetForTest, geometry: workLengthDataGeometryPolygonForTest })],
      interventionArea: {
        isEdited: false,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-73.62899780273438, 45.52897482086003],
              [-73.62918019294739, 45.52872679001011],
              [-73.62661600112915, 45.52799020709987],
              [-73.6264443397522, 45.52822320885938],
              [-73.62899780273438, 45.52897482086003]
            ]
          ]
        },
        geometryPin: [-73.62788200378418, 45.528471241929886]
      },
      roadSections: {
        type: 'FeatureCollection',
        features: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [-73.62954497337341, 45.528997369064896],
                [-73.62832188606261, 45.52863659670261]
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
          }
        ]
      },
      audit: {
        createdBy: createAuthorMock()
      }
    };
    return intervention;
  }

  public getPolygonAssetRoadSectionIntersectingAreaStartingInsideIntervention(): IEnrichedIntervention {
    const intervention: IEnrichedIntervention = {
      interventionName: 'interventionName',
      interventionTypeId: 'initialNeed',
      workTypeId: 'reconstruction',
      requestorId: 'borough',
      executorId: EXECUTOR_DI,
      boroughId: 'VM',
      programId: 'pcpr',
      interventionYear: appUtils.getCurrentYear(),
      planificationYear: appUtils.getCurrentYear(),
      status: null,
      estimate: { allowance: 10, burnedDown: 0, balance: 10 },
      contact: 'test',
      assets: [getAssetProps({ ...interventionDataAssetForTest, geometry: workLengthDataGeometryPolygonForTest })],
      interventionArea: {
        isEdited: false,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-73.62899780273438, 45.52897482086003],
              [-73.62918019294739, 45.52872679001011],
              [-73.62661600112915, 45.52799020709987],
              [-73.6264443397522, 45.52822320885938],
              [-73.62899780273438, 45.52897482086003]
            ]
          ]
        },
        geometryPin: [-73.62788200378418, 45.528471241929886]
      },
      roadSections: {
        type: 'FeatureCollection',
        features: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [-73.62724900245667, 45.52830588667107],
                [-73.626047372818, 45.5279676584913]
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
          }
        ]
      },
      audit: {
        createdBy: createAuthorMock()
      }
    };
    return intervention;
  }

  public getPolygonAssetRoadSectionOutsideIntervention(): IEnrichedIntervention {
    const intervention: IEnrichedIntervention = {
      interventionName: 'interventionName',
      interventionTypeId: 'initialNeed',
      workTypeId: 'reconstruction',
      requestorId: 'borough',
      executorId: EXECUTOR_DI,
      boroughId: 'VM',
      programId: 'pcpr',
      interventionYear: appUtils.getCurrentYear(),
      planificationYear: appUtils.getCurrentYear(),
      status: null,
      estimate: { allowance: 10, burnedDown: 0, balance: 10 },
      contact: 'test',
      assets: [getAssetProps({ ...interventionDataAssetForTest, geometry: workLengthDataGeometryPolygonForTest })],
      interventionArea: {
        isEdited: false,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-73.62899780273438, 45.52897482086003],
              [-73.62918019294739, 45.52872679001011],
              [-73.62661600112915, 45.52799020709987],
              [-73.6264443397522, 45.52822320885938],
              [-73.62899780273438, 45.52897482086003]
            ]
          ]
        },
        geometryPin: [-73.62788200378418, 45.528471241929886]
      },
      roadSections: {
        type: 'FeatureCollection',
        features: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [-73.6297059059143, 45.529049981507725],
                [-73.62922310829163, 45.52891469226958]
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
          }
        ]
      },
      audit: {
        createdBy: createAuthorMock()
      }
    };
    return intervention;
  }
}

export const workLengthData = new WorkLengthData();
