import { ILogicLayerGroup } from '../layer-manager';

export interface IMapLayerVisibilityChangeEvent {
  display: boolean;
  logicLayers: string[];
  clickedGroup?: ILogicLayerGroup;
}
