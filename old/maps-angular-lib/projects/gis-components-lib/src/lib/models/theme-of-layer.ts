import { Layer } from 'mapbox-gl';

export interface ITheme {
  themeId: string;
  name: string;
  logicalLayerId?: string;
}

export interface IThemeMapbox extends ITheme {
  layers: Layer[];
}
