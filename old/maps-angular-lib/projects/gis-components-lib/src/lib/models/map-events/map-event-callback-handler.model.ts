export interface IMapEventCallbackHandlers {
  mapClick?: (responseData: any) => void;
  layerVisibility?: (responseData: any) => void;
  mapLayersUpdate?: (responseData: any) => void;
}
