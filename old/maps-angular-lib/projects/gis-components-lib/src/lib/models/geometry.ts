export interface IPoint {
  lon: number; // longitude in degree
  lat: number; // latitude in degree
  h?: number;
}

export interface IScreenPoint {
  x: number; // map coordinate x position
  y: number; // map coordinate y position
}

export interface ISpatialObject {
  geometry: {
    type: string;
    coordinates: IPoint[];
  };
}
