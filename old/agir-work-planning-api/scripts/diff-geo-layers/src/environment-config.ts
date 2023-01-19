import { REPLACE_FLAG } from './constants';

export interface IEnvironmentConfig {
  url: string;
  token?: string;
}

// Constants
export const environmentConfigs: IEnvironmentConfig[] = [
  {
    url: `https://api.dev.montreal.ca/api/it-platforms/geomatic/vector-tiles/secured/maps/v1/${REPLACE_FLAG}/tiles.json`,
    token: 'REPLACE' // Replace before running, reset before committing.
  },
  {
    url: `https://api.montreal.ca/api/it-platforms/geomatic/vector-tiles/secured/maps/v1/${REPLACE_FLAG}/tiles.json`,
    token: 'REPLACE' // Replace before running, reset before committing.
  }
];
