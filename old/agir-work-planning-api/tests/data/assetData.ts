import { IAsset, IGeometry, IInterventionArea } from '@villemontreal/agir-work-planning-lib';

import { LengthUnit } from '../../src/features/length/models/length';

export function getInitialAsset(): IAsset {
  return {
    id: '21',
    typeId: 'fireHydrant',
    ownerId: 'dgrse',
    length: {
      unit: LengthUnit.meter,
      value: 0
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [-73.628827, 45.521005],
        [-73.627784, 45.52276],
        [-73.627891, 45.522779],
        [-73.628905, 45.521039]
      ]
    }
  } as IAsset;
}

/**
 * Creates a IAsset with specified attribute to add variation
 * between created IAsset
 * @param attributes attributes that exists in a IAsset
 */
export function createAssetModel(attributes: any): IAsset {
  const assetModel: IAsset = getInitialAsset();
  Object.assign(assetModel, attributes);
  return assetModel;
}

/**
 * Creates a list of PlainIntervention to insert for testing
 */
export function createAssetList(): IAsset[] {
  const list: IAsset[] = [];
  list.push(
    createAssetModel({
      id: 'fireHydrant-1',
      typeId: 'fireHydrant',
      geometry: {
        type: 'Point',
        coordinates: [-73.628827, 45.521005]
      }
    }),
    createAssetModel({
      id: 'streetTree-1',
      ownerId: 'dep',
      geometry: {
        type: 'Point',
        coordinates: [-73.627891, 45.522779]
      },
      length: {
        unit: LengthUnit.meter,
        value: 0
      },
      typeId: 'streetTree'
    })
  );
  return list;
}
export function getSuggestedStreetName(): string {
  return 'getSuggestedStreetName';
}

export function getInterventionAreaBig(): IInterventionArea {
  return {
    isEdited: false,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-73.6531162261963, 45.5251114283173],
          [-73.65515470504761, 45.52571275198491],
          [-73.65534782409668, 45.52682518382482],
          [-73.6607122421265, 45.5291702383351],
          [-73.6707544326782, 45.5315452579927],
          [-73.6750030517578, 45.5301623473507],
          [-73.6699604988098, 45.5291552062457],
          [-73.6553907394409, 45.5247656642979],
          [-73.6531162261963, 45.5251114283173]
        ]
      ]
    }
  };
}

export function getMultiPolygonInterventionArea(): IInterventionArea {
  return {
    isEdited: false,
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [-73.66914510726929, 45.52908004573866],
            [-73.66836190223694, 45.528854563614836],
            [-73.66808295249939, 45.52917775437828],
            [-73.66912364959717, 45.52944081525666],
            [-73.66914510726929, 45.52908004573866]
          ]
        ],
        [
          [
            [-73.6684477329254, 45.530741069528474],
            [-73.66865158081055, 45.5304479512476],
            [-73.66750359535217, 45.53010222002975],
            [-73.66729974746703, 45.53041037187034],
            [-73.6684477329254, 45.530741069528474]
          ]
        ]
      ]
    }
  };
}

export function getBadPolygon(): IGeometry {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [-73.6531162261963, 45.5251114283173],
        [-73.6532878875732, 45.5267951183887],
        [-73.6607122421265, 45.5291702383351]
      ]
    ]
  };
}
