import { IAsset, IGeometry } from '@villemontreal/agir-work-planning-lib';

export const assetMocks: IAsset[] = [
  {
    id: '1',
    geometry: {
      type: 'Polygon',
      coordinates: []
    },
    length: {
      unit: 'm',
      value: 0
    },
    ownerId: '1',
    typeId: '1'
  }
];

export const assetLinearStreet: IGeometry = {
  type: 'LineString',
  coordinates: [
    [-73.67090195417404, 45.544051914638956],
    [-73.67025822401047, 45.54386594147373]
  ]
};

export const assetLinearIntersection: IGeometry = {
  type: 'LineString',
  coordinates: [
    [-73.67075711488724, 45.54467745622519],
    [-73.67080807685852, 45.544758231358024]
  ]
};

export const assetLinearStreetPerpendicular: IGeometry = {
  type: 'LineString',
  coordinates: [
    [-73.66971641778945, 45.544241644203815],
    [-73.66953134536743, 45.54449336362831]
  ]
};

export const assetLinearStreetFar: IGeometry = {
  type: 'LineString',
  coordinates: [
    [-73.67054522037506, 45.54318403460447],
    [-73.66993367671967, 45.54300369421477]
  ]
};

export const assetLinear90Degrees: IGeometry = {
  type: 'LineString',
  coordinates: [
    [-73.67207407951355, 45.542644890260654],
    [-73.67187827825546, 45.5429961800193],
    [-73.67123991250992, 45.5427932963623]
  ]
};

export const assetLinearTooFar: IGeometry = {
  type: 'LineString',
  coordinates: [
    [-73.67564141750336, 45.54043190217008],
    [-73.67519617080688, 45.54118710823614]
  ]
};

export const mockAssetsCollection: any = {
  bbox: null,
  features: [
    assetLinearStreet,
    assetLinearIntersection,
    assetLinearStreetPerpendicular,
    assetLinearStreetFar,
    assetLinear90Degrees,
    assetLinearTooFar
  ].map((g, i) => {
    return {
      bbox: null,
      geometry: g,
      id: i + 1,
      properties: {
        id: i + 1,
        sourceLayer: 'mock-assets'
      },
      type: 'Feature'
    } as any;
  }),
  type: 'FeatureCollection'
} as any;
