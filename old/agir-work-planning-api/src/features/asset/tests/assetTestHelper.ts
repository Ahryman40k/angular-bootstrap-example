import {
  IAsset,
  IFeature,
  IFeatureCollection,
  IGeometry,
  IInterventionArea
} from '@villemontreal/agir-work-planning-lib';
import { Feature, Polygon } from 'geojson';
import { omit } from 'lodash';

import { streetResult } from '../../../../tests/data/assets/work-area';
import { mergeProperties } from '../../../../tests/utils/testHelper';
import { getInitialLength } from '../../length/tests/lengthTestHelper';
import { Asset, IAssetProps } from '../models/asset';

const SAINT_LAURENT = 'Saint-Laurent';
const MONTREAL = 'Montréal';
const MTL = 'MTL';
const BOROUGH_ID = 15;
let ASSET_ID_LAST_NUMBER = 0;

export function getInitialAsset(): IAssetProps {
  return {
    id: '21',
    typeId: 'fireHydrant',
    ownerId: 'dgrse',
    length: getInitialLength(),
    geometry: {
      type: 'Polygon',
      coordinates: [
        [-73.628827, 45.521005],
        [-73.627784, 45.52276],
        [-73.627891, 45.522779],
        [-73.628905, 45.521039]
      ]
    }
  };
}

export function getFeature(props?: Partial<IFeature>): IFeature {
  const properties = {
    id: 201858,
    no: 5026672,
    makeModel: 'Modèle à corriger - à valider',
    owner: 'VDM',
    valve: null,
    juridiction: 'LOCALE',
    dateInstallation: '1909-01-01T00:00:00',
    ...props?.properties
  };
  return {
    type: 'Feature',
    id: 'fire-hydrants.22796',
    geometry: { type: 'Point', coordinates: [-73.654774, 45.526105] },
    properties,
    ...omit(props, 'properties')
  };
}

export function getWorkAreaFeature(input?: Partial<IFeature>): IFeature {
  return mergeProperties(
    {
      type: 'Feature',
      id: 'pavement-sections.65004',
      geometry: streetResult as any,
      properties: {
        id: '65248',
        roadId: '1040170',
        pavementMaterialRef: 'Asphalte',
        thmGeo: '1',
        area: '1881.238',
        estimatedLength: '337.79',
        estimatedWidth: '5.569'
      }
    },
    input
  );
}

export function getWorkAreaFeatureAsPolygon(input?: Partial<IFeature>): Feature<Polygon> {
  return getWorkAreaFeature(input) as Feature<Polygon>;
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
      length: getInitialLength(),
      typeId: 'streetTree'
    })
  );
  return list;
}

export function getWorkArea(): IGeometry {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [-73.654601, 45.526137],
        [-73.654495, 45.526324],
        [-73.654227, 45.526803],
        [-73.654165, 45.526914],
        [-73.65402, 45.527159],
        [-73.65402, 45.527159],
        [-73.654093, 45.527183],
        [-73.654141, 45.527098],
        [-73.65419, 45.527016],
        [-73.654212, 45.526977],
        [-73.654246, 45.526923],
        [-73.654283, 45.526859],
        [-73.654329, 45.526782],
        [-73.654385, 45.526687],
        [-73.654428, 45.526614],
        [-73.654469, 45.526544],
        [-73.654514, 45.526468],
        [-73.654554, 45.526402],
        [-73.654617, 45.526296],
        [-73.65466, 45.526223],
        [-73.654695, 45.526165],
        [-73.654728, 45.526108],
        [-73.654758, 45.526057],
        [-73.654773, 45.526032],
        [-73.654793, 45.525999],
        [-73.654829, 45.525937],
        [-73.654733, 45.52591],
        [-73.654731, 45.525909],
        [-73.654601, 45.526137]
      ]
    ]
  };
}
export function getRoadSections(): IFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'road-sections.22704',
        geometry: {
          type: 'LineString',
          coordinates: [
            [-73.654367, 45.526523],
            [-73.654835, 45.52582],
            [-73.654923, 45.525691],
            [-73.655023, 45.52557],
            [-73.655115, 45.525506],
            [-73.65537, 45.525384],
            [-73.655479, 45.525345],
            [-73.655601, 45.525331],
            [-73.655769, 45.525308]
          ]
        },
        properties: {
          id: 1607691,
          name: 'rue Gince ',
          shortName: 'Gince',
          fromName: 'rue De Beauharnois Ouest ',
          fromShortName: 'De Beauharnois',
          toName: 'boulevard Lebeau ',
          toShortName: 'Lebeau',
          scanDirection: 1,
          classification: 0,
          cityName: MONTREAL,
          cityNameLeft: MONTREAL,
          cityNameRight: MONTREAL,
          cityId: MTL,
          cityIdLeft: MTL,
          cityIdRight: MTL,
          borough: SAINT_LAURENT,
          boroughLeft: SAINT_LAURENT,
          boroughRight: SAINT_LAURENT,
          boroughId: BOROUGH_ID,
          boroughIdLeft: BOROUGH_ID,
          boroughIdRight: BOROUGH_ID
        }
      }
    ]
  };
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

export function getAsset(props?: Partial<IAssetProps>): Asset {
  return Asset.create(getAssetProps(props)).getValue();
}

export function getAssetProps(props?: Partial<IAssetProps>): IAssetProps {
  const id = props?.id ? props.id : `R15${ASSET_ID_LAST_NUMBER}`;
  ASSET_ID_LAST_NUMBER++;
  return {
    ...getInitialAsset(),
    ...props,
    id
  };
}

export function getInitialAssetId(): string {
  return 'R145';
}
