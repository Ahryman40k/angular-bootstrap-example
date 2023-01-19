export interface ILogicLayerGroup {
  label: string;
  layerGroups?: ILogicLayerGroup[];
  layers?: ILogicLayer[];
  isActive?: boolean;
  isChecked?: boolean;
}

export interface ILogicLayer {
  label?: string;
  logicLayerId: string;
  isActive?: boolean;
  isChecked?: boolean;
  zoomRange?: ILayerZoomRange;
}

export interface ILayerManagerConfig {
  theme?: string;
  layerGroups: ILogicLayerGroup[];
}

export interface ICheckboxState {
  checked: boolean;
  logicalCorrespondance: ILogicLayer | ILogicLayerGroup;
}

export interface ILayerZoomRange {
  maxzoom?: number;
  minzoom?: number;
}
