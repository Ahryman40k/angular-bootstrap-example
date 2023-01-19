import {
  CommentCategory,
  IEnrichedIntervention,
  IExternalReferenceId,
  IGeometry,
  IHistory,
  InterventionExternalReferenceType,
  InterventionStatus,
  IPlainIntervention
} from '@villemontreal/agir-work-planning-lib';
import * as _ from 'lodash';
import * as mongoose from 'mongoose';

import { createEnrichedInterventionModel } from '../../scripts/load_data/outils/interventionDataOutils';
import { IAssetProps } from '../../src/features/asset/models/asset';
import { getAssetProps } from '../../src/features/asset/tests/assetTestHelper';
import { getIComment } from '../../src/features/comments/tests/commentTestHelper';
import { db } from '../../src/features/database/DB';
import { getIEnrichedDocument } from '../../src/features/documents/tests/documentsTestHelper';
import { LengthUnit } from '../../src/features/length/models/length';
import { EXECUTOR_DI, ROAD_NETWORK_TYPE_LOCAL } from '../../src/shared/taxonomies/constants';
import { appUtils } from '../../src/utils/utils';
import { normalizeDataTest } from '../utils/normalizeDataTest';
import { createAuthorMock } from './author.mocks';

export type IEnrichedInterventionPatch = Partial<IEnrichedIntervention>;

export const interventionDataAssetForTest: Partial<IAssetProps> = {
  typeId: 'fireHydrant',
  ownerId: 'dep',
  length: {
    unit: LengthUnit.meter,
    value: 0
  },
  geometry: {
    type: 'Point',
    coordinates: [-73.65451700985432, 45.526319236766945]
  }
};

// tslint:disable-next-line:max-func-body-length
export function getMinimalInitialIntervention(): IEnrichedIntervention {
  const currentYear = appUtils.getCurrentYear();
  const intervention: IEnrichedIntervention = {
    interventionName: 'interventionName',
    interventionTypeId: 'initialNeed',
    workTypeId: 'reconstruction',
    requestorId: 'borough',
    boroughId: 'VM',
    status: null,
    interventionYear: currentYear,
    planificationYear: currentYear,
    estimate: { allowance: 10, burnedDown: 0, balance: 0 },
    executorId: EXECUTOR_DI,
    contact: 'test',
    assets: [getAssetProps(interventionDataAssetForTest)],
    interventionArea: {
      isEdited: false,
      geometry: getInterventionAreaGeometry(),
      geometryPin: [-73.65454316139221, 45.52624830046475]
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
    },
    audit: {
      createdBy: createAuthorMock()
    }
  };
  return intervention;
}

/**
 *  return a common geometry used for the intervention in various place in the tests
 *
 * @export
 */
export function getInterventionAreaGeometry(): IGeometry {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [-73.65474432706833, 45.5260077740589],
        [-73.65463703870773, 45.525981466420895],
        [-73.65431785583496, 45.52646815573291],
        [-73.65447610616684, 45.52647191393514],
        [-73.65474432706833, 45.5260077740589]
      ]
    ]
  };
}

/**
 *  return a shorter geometry compared to geometry from  getInterventionAreaGeometry()
 *
 * @export
 * @returns {IGeometry}
 */
export function getInterventionAreaGeometryModified(): IGeometry {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [-73.65451768040657, 45.526396749842604],
        [-73.6547563970089, 45.526001197150585],
        [-73.65464642643929, 45.52597582906827],
        [-73.65438491106033, 45.526372321490896],
        [-73.65451768040657, 45.526396749842604]
      ]
    ]
  };
}

export function getMinimalInitialPolygonIntervention(): IEnrichedIntervention {
  const intervention = getMinimalInitialIntervention();
  setGeometryAndAssetForMinimalInitialPolygonIntervention(intervention);
  return intervention;
}

/**
 *  Change the geometry on the intervention to a polygon and add asset as a geometry INSIDE of the intervention geometry
 *
 * @export
 * @param {IEnrichedIntervention} intervention
 * @returns
 */
export function setGeometryAndAssetForMinimalInitialPolygonIntervention(intervention: IEnrichedIntervention) {
  intervention.interventionArea.geometry = getInterventionAreaGeometry();
  intervention.assets[0].geometry = {
    type: 'Polygon',
    coordinates: [
      [
        [-73.65464910864829, 45.52612333960882],
        [-73.65467995405197, 45.52609139468382],
        [-73.65464642643929, 45.52605663106833],
        [-73.65458607673645, 45.52611300448801],
        [-73.65464910864829, 45.52612333960882]
      ]
    ]
  };
  intervention.assets[0].roadSections = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [-73.65473359823227, 45.52600683450063],
            [-73.65449354052544, 45.526337558049015]
          ]
        }
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [-73.65449085831642, 45.52633849760179],
            [-73.6544144153595, 45.52647003483405]
          ]
        }
      }
    ]
  };
  return intervention;
}

export function getCompleteEnrichedIntervention(): IEnrichedIntervention {
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
    estimate: { allowance: 10, burnedDown: 0, balance: 0 },
    contact: 'test',
    assets: [getAssetProps(interventionDataAssetForTest)],
    interventionArea: {
      isEdited: false,
      geometry: {
        type: 'Point',
        coordinates: [-73.557921, 45.492239]
      },
      geometryPin: [-73.557921, 45.492239]
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
    },
    audit: {
      createdBy: createAuthorMock(),
      lastModifiedBy: createAuthorMock()
    },
    comments: [
      getIComment({
        text: 'test 1',
        categoryId: CommentCategory.other,
        isPublic: true
      })
    ],
    externalReferenceIds: [
      {
        type: InterventionExternalReferenceType.ptiNumber,
        value: 'test'
      },
      {
        type: InterventionExternalReferenceType.requestorReferenceNumber,
        value: 'test'
      }
    ],
    roadNetworkTypeId: ROAD_NETWORK_TYPE_LOCAL,
    medalId: 'silver'
  };
  return intervention;
}

// tslint:disable:max-func-body-length
export function getEnrichedCompleteIntervention(props?: Partial<IEnrichedIntervention>): IEnrichedIntervention {
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
    status: InterventionStatus.waiting,
    estimate: { allowance: 10, burnedDown: 0, balance: 10 },
    contact: 'test',
    assets: [getAssetProps(interventionDataAssetForTest)],
    interventionArea: {
      isEdited: false,
      geometry: getInterventionAreaGeometry(),
      geometryPin: [-73.65454316139221, 45.52624830046475]
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
    },
    audit: {
      createdBy: createAuthorMock()
    },
    decisions: [
      {
        id: '123',
        text: 'test decision 1',
        typeId: 'accepted',
        audit: {
          createdAt: Date.now().toString()
        }
      }
    ],
    comments: [
      getIComment({
        text: 'test 1',
        categoryId: CommentCategory.information,
        isPublic: true
      }),
      getIComment({
        text: 'test 2',
        categoryId: CommentCategory.information,
        isPublic: true
      })
    ]
  };
  return { ...intervention, ...props };
}

export function getBadOtherCommentIntervention(partial?: Partial<IEnrichedIntervention>): IEnrichedIntervention {
  const intervention = getMinimalInitialIntervention();
  Object.assign(intervention, partial, {
    comments: [
      {
        id: mongoose.Types.ObjectId().toHexString(),
        text: 'test 1',
        categoryId: CommentCategory.other,
        isPublic: true
      },
      {
        id: mongoose.Types.ObjectId().toHexString(),
        text: 'test 1',
        categoryId: CommentCategory.other,
        isPublic: true
      }
    ]
  });
  return intervention;
}

export function getBadExternalReferenceTaxoIntervention(
  partial?: Partial<IEnrichedIntervention>
): IEnrichedIntervention {
  const intervention = getMinimalInitialIntervention();
  Object.assign(intervention, partial, {
    externalReferenceIds: [
      {
        type: 'wrong taxonomy',
        value: '1'
      }
    ] as IExternalReferenceId[]
  });
  return intervention;
}

export function getBadExternalReferenceCountIntervention(
  type: string,
  partial?: Partial<IEnrichedIntervention>
): IEnrichedIntervention {
  const intervention = getMinimalInitialIntervention();
  Object.assign(intervention, partial, {
    externalReferenceIds: [
      {
        type,
        value: '1'
      },
      {
        type,
        value: '2e de trop'
      }
    ] as IExternalReferenceId[]
  });
  return intervention;
}

export function getBadBoroughIdIntervention(): IPlainIntervention {
  const intervention: IPlainIntervention = {
    interventionName: 'interventionName',
    interventionTypeId: 'initialNeed',
    workTypeId: 'D1',
    requestorId: 'borough',
    executorId: EXECUTOR_DI,
    boroughId: 'GHOST',
    programId: 'pcpr',
    interventionYear: appUtils.getCurrentYear(),
    planificationYear: appUtils.getCurrentYear(),
    estimate: 10,
    status: null,
    contact: 'test',
    assets: [getAssetProps({ ...interventionDataAssetForTest, ownerId: 'bic' })],
    interventionArea: {
      isEdited: false,
      geometry: getInterventionAreaGeometry(),
      geometryPin: [-73.557921, 45.492239]
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
    },
    audit: {
      createdBy: createAuthorMock()
    }
  };
  return intervention;
}

export function getBadGeometriesIntervention(): IPlainIntervention {
  const intervention: IPlainIntervention = {
    interventionName: 'interventionName',
    interventionTypeId: 'initialNeed',
    workTypeId: 'D1',
    requestorId: 'borough',
    executorId: EXECUTOR_DI,
    boroughId: 'VM',
    programId: 'pcpr',
    interventionYear: appUtils.getCurrentYear(),
    planificationYear: appUtils.getCurrentYear(),
    estimate: 10,
    contact: 'test',
    assets: [getAssetProps({ ...interventionDataAssetForTest, geometry: null })],
    interventionArea: {
      isEdited: false,
      geometry: null,
      geometryPin: [-73.65454316139221, 45.52624830046475]
    },
    roadSections: {
      type: 'FeatureCollection',
      features: [
        {
          geometry: {
            type: 'Polygon',
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
        }
      ]
    },
    audit: {
      createdBy: createAuthorMock()
    }
  };
  return intervention;
}

export function getInterventionOutsideViewport(): IEnrichedIntervention {
  const interventionPartialAttributes: Partial<IEnrichedIntervention> = {
    assets: [
      getAssetProps({
        ...interventionDataAssetForTest,
        typeId: 'un',
        ownerId: 'bic',
        geometry: {
          type: 'Point',
          coordinates: [-73.59810143709183, 45.5419197611433]
        }
      })
    ],
    interventionArea: {
      isEdited: false,
      geometry: {
        type: 'Point',
        coordinates: [-73.557921, 45.492239]
      },
      geometryPin: [-73.557921, 45.492239]
    }
  };
  return createInterventionModel(interventionPartialAttributes);
}

export function getInterventionInsideViewport() {
  const interventionPartialAttributes: Partial<IEnrichedIntervention> = {
    assets: [
      getAssetProps({
        ...interventionDataAssetForTest,
        id: '201339',
        ownerId: 'VDM',
        geometry: {
          type: 'Point',
          coordinates: [-73.672166, 45.523895]
        }
      })
    ],
    interventionArea: {
      isEdited: false,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-73.672062, 45.523886],
            [-73.671977, 45.524017],
            [-73.67191, 45.524111],
            [-73.671862, 45.524169],
            [-73.671838, 45.524202],
            [-73.671637, 45.524517],
            [-73.671636, 45.524519],
            [-73.671688, 45.524534],
            [-73.671817, 45.524322],
            [-73.671884, 45.524217],
            [-73.67191, 45.524185],
            [-73.671966, 45.524129],
            [-73.672006, 45.524082],
            [-73.672039, 45.524037],
            [-73.672093, 45.523954],
            [-73.672148, 45.523868],
            [-73.67216, 45.523861],
            [-73.672175, 45.523857],
            [-73.672093, 45.523839],
            [-73.672062, 45.523886]
          ]
        ]
      },
      geometryPin: [-73.557921, 45.492239]
    }
  };
  return createInterventionModel(interventionPartialAttributes);
}

/**
 * Used in project tests. Project has a certain geometry,
 * so this geometry is in project's geometry.
 * It has the right satus to become integrated
 */
export function getProjectInterventionToIntegrate() {
  const intervention = getMinimalInitialIntervention();
  intervention.status = InterventionStatus.waiting;
  intervention.assets = [getAssetProps(interventionDataAssetForTest)];
  return intervention;
}

/**
 * Creates a PlainIntervention with specified attribute to add variation
 * between created PlainIntervention
 * @param attributes attributes that exists in a PlainIntervention
 */
export function createInterventionModel(attributes?: Partial<IEnrichedIntervention>): IEnrichedIntervention {
  const interventionModel: IEnrichedIntervention = getCompleteEnrichedIntervention();
  Object.assign(interventionModel, attributes);
  return interventionModel;
}

/**
 * Creates a list of PlainIntervention to insert for testing
 */
export function createInterventionList(): IEnrichedIntervention[] {
  const list: IEnrichedIntervention[] = [];
  list.push(
    createEnrichedInterventionModel({
      boroughId: 'SAME',
      status: InterventionStatus.waiting,
      project: { id: 'P12345', typeId: 'integrated' },
      comments: [
        getIComment({
          text: 'test 1',
          categoryId: CommentCategory.information,
          isPublic: true
        })
      ],
      decisions: [
        {
          id: mongoose.Types.ObjectId().toHexString(),
          text: 'test decision 1',
          typeId: 'planned',
          audit: {
            createdAt: Date.now().toString()
          }
        }
      ],
      documents: [getIEnrichedDocument()]
    })
  );
  list.push(createEnrichedInterventionModel({ boroughId: 'SAME', status: InterventionStatus.waiting }));
  list.push(createEnrichedInterventionModel({ boroughId: 'SAME', status: InterventionStatus.waiting }));
  list.push(createEnrichedInterventionModel({ boroughId: 'SAME', status: InterventionStatus.waiting }));
  list.push(createEnrichedInterventionModel({ boroughId: 'SAME', status: InterventionStatus.waiting }));
  list.push(createEnrichedInterventionModel({ programId: 'sae', status: InterventionStatus.waiting }));
  list.push(createEnrichedInterventionModel({ programId: 'par', status: InterventionStatus.waiting }));
  list.push(createEnrichedInterventionModel({ programId: 'prcpr', status: InterventionStatus.waiting }));
  list.push(createEnrichedInterventionModel({ status: InterventionStatus.waiting }));
  list.push(createEnrichedInterventionModel({ decisionRequired: true }));
  list.push(createEnrichedInterventionModel({ decisionRequired: false }));
  list.push(createEnrichedInterventionModel({ status: InterventionStatus.wished }));
  return list;
}

/**
 * Creates a list of PlainIntervention ordered by InterventionType And Status
 */
export function interventionListOrderdByInterventionTypeAndStatus(): IEnrichedIntervention[] {
  const list: IEnrichedIntervention[] = [];
  list.push(
    createEnrichedInterventionModel({
      boroughId: 'SAME',
      status: InterventionStatus.waiting
    })
  );
  list.push(createEnrichedInterventionModel({ boroughId: 'SAME', status: InterventionStatus.waiting }));
  list.push(createEnrichedInterventionModel({ boroughId: 'VM', programId: 'sae', status: InterventionStatus.waiting }));
  list.push(createEnrichedInterventionModel({ programId: 'par', status: InterventionStatus.waiting }));
  list.push(createEnrichedInterventionModel({ programId: 'prcpr', status: InterventionStatus.waiting }));
  list.push(createEnrichedInterventionModel({ programId: 'pcpr', status: InterventionStatus.waiting }));
  list.push(
    createEnrichedInterventionModel({
      documents: [getIEnrichedDocument()],
      boroughId: 'SAME',
      comments: [
        getIComment({
          text: 'test 1',
          categoryId: CommentCategory.information,
          isPublic: true
        })
      ],
      decisions: [
        {
          text: 'test decision 1',
          typeId: 'planned'
        }
      ],
      programId: 'pcpr',
      status: InterventionStatus.waiting,
      project: {
        id: 'P12345',
        typeId: 'integrated'
      }
    })
  );
  list.push(createEnrichedInterventionModel({ boroughId: 'SAME', status: InterventionStatus.waiting }));
  list.push(
    createEnrichedInterventionModel({
      boroughId: 'SAME',
      status: InterventionStatus.waiting
    })
  );
  return list;
}

export function getIntersectGeometry(): GeoJSON.Geometry {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [-73.60084533691405, 45.47481803911341],
        [-73.5369873046875, 45.47481803911341],
        [-73.5369873046875, 45.51308360513238],
        [-73.60084533691405, 45.51308360513238],
        [-73.60084533691405, 45.47481803911341]
      ]
    ]
  } as GeoJSON.Geometry;
}

export function getNotIntersectGeometry(): GeoJSON.Geometry {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [-73.60668182373047, 45.55661213242548],
        [-73.58333587646484, 45.55661213242548],
        [-73.58333587646484, 45.56238134091642],
        [-73.60668182373047, 45.56238134091642],
        [-73.60668182373047, 45.55661213242548]
      ]
    ]
  } as GeoJSON.Geometry;
}

export function getPlainIntervention(props?: Partial<IPlainIntervention>): IPlainIntervention {
  let intervention: IPlainIntervention = {
    interventionName: 'interventionName',
    interventionTypeId: 'initialNeed',
    workTypeId: 'reconstruction',
    requestorId: 'borough',
    executorId: EXECUTOR_DI,
    boroughId: 'VM',
    status: null,
    interventionYear: appUtils.getCurrentYear(),
    planificationYear: appUtils.getCurrentYear(),
    estimate: 10,
    contact: 'test',
    assets: [getAssetProps(interventionDataAssetForTest)],
    interventionArea: {
      isEdited: false,
      geometry: getInterventionAreaGeometry(),
      geometryPin: [-73.65454316139221, 45.52624830046475]
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
    },
    audit: {
      createdBy: createAuthorMock()
    }
  };

  intervention = { ...intervention, ...props };

  return intervention;
}

export function getMockInterventionHistory(
  id: string,
  actionId: 'create' | 'update' | 'delete',
  comments: string
): IHistory {
  return {
    objectTypeId: 'intervention',
    referenceId: id,
    actionId,
    summary: {
      statusFrom: '',
      statusTo: 'planned',
      comments
    }
  };
}

export function createPlainInterventionFromEnrichedIntervention(
  enrichedIntervention: IEnrichedIntervention
): IPlainIntervention {
  const intervention: IPlainIntervention = {
    assets: [_.cloneDeep(enrichedIntervention.assets[0])],
    boroughId: enrichedIntervention.boroughId,
    contact: enrichedIntervention.contact,
    decisionRequired: enrichedIntervention.decisionRequired,
    estimate: enrichedIntervention.estimate.allowance,
    externalReferenceIds: enrichedIntervention.externalReferenceIds,
    executorId: EXECUTOR_DI,
    id: enrichedIntervention.id,
    importFlag: enrichedIntervention.importFlag,
    interventionArea: _.cloneDeep(enrichedIntervention.interventionArea),
    interventionName: enrichedIntervention.interventionName,
    interventionTypeId: enrichedIntervention.interventionTypeId,
    interventionYear: enrichedIntervention.interventionYear,
    medalId: enrichedIntervention.medalId,
    planificationYear: enrichedIntervention.planificationYear,
    programId: enrichedIntervention.programId,
    requestorId: enrichedIntervention.requestorId,
    roadSections: _.cloneDeep(enrichedIntervention.roadSections),
    status: enrichedIntervention.status,
    workTypeId: enrichedIntervention.workTypeId
  };
  return intervention;
}

export function createEnrichedIntervention(partial?: Partial<IEnrichedIntervention>): IEnrichedIntervention {
  const intervention: IEnrichedIntervention = getProjectInterventionToIntegrate();
  Object.assign(intervention, partial);
  return intervention;
}

export async function createMockIntervention(partial?: Partial<IEnrichedIntervention>): Promise<IEnrichedIntervention> {
  const interventionModel = db().models.Intervention;
  const mockResult = createEnrichedIntervention(partial);
  const docs = await interventionModel.create([mockResult]);
  const doc = normalizeDataTest.normalizeData(docs[0].toObject());
  return doc;
}

export function interventionEnrichedToPlain(partial?: Partial<IEnrichedIntervention>): IPlainIntervention {
  const minimalIntervention = getMinimalInitialIntervention();
  const attributesToDelete = [
    'project',
    'annualDistribution',
    'moreInformationAudit',
    'roadNetworkTypeId',
    'streetName',
    'streetFrom',
    'streetTo',
    'constraints'
  ];
  attributesToDelete.forEach(key => {
    delete minimalIntervention[key];
    delete partial[key];
  });

  return {
    ...minimalIntervention,
    ...partial,
    estimate: partial.estimate?.allowance || 10
  };
}
