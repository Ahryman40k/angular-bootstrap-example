import { IDate } from '@villemontreal/agir-work-planning-lib/dist/src';
import { IGlobalLayer } from 'src/app/map/panel/asset-layer/global-layer';

import { IGlobalFilter } from '../filters/global-filter';

export interface IGlobalFavoriteProps {
  name: string;
  layer: IGlobalLayer;
  filter: IGlobalFilter;
  createdAt: IDate;
}
export interface IGlobalFavorite extends IGlobalFavoriteProps {
  id: string;
}

export function initFavorite(favoriteProperties: IGlobalFavoriteProps): IGlobalFavorite {
  // add an id attribute to favorite to replace forbidden url chars in favorite name
  return {
    ...favoriteProperties,
    id: favoriteProperties.name.replace(/[^a-zA-Z0-9-_]/g, '-')
  };
}
