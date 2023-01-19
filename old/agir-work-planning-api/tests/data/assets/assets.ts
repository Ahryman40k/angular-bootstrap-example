import { FeatureCollection, Point } from 'geojson';

const wfsAssetsResponse: FeatureCollection<Point, {}> = {
  type: 'FeatureCollection',
  features: [
    {
      id: 'fire-hydrants.12345',
      type: 'Feature',
      properties: {
        idKey: 'id',
        id: 12345,
        dateInstallation: '1909-01-01T00:00:00'
      },
      geometry: {
        type: 'Point',
        coordinates: [-73.66841554641724, 45.546247854280004]
      }
    },
    {
      id: 'regards-egouts.7834578',
      type: 'Feature',
      properties: {
        idKey: 'noGeomatiqueRegard',
        id: 7834578,
        noGeomatiqueRegard: 7834578,
        dateInstallation: '1909-01-01T00:00:00'
      },
      geometry: {
        type: 'Point',
        coordinates: [-73.66951525211333, 45.546863979333246]
      }
    }
  ]
};

export const assetsData = {
  wfsAssetsResponse
};
