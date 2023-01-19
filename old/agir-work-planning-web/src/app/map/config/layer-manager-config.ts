import { ILayerManagerConfig } from '@villemontreal/maps-angular-lib';

export const layerManagerConfig: ILayerManagerConfig = {
  theme: 'bootstrap-theme',
  layerGroups: [
    {
      label: 'Actifs',
      layers: [
        { label: 'Arbres sur rue', logicLayerId: 'streetTrees' },
        { label: 'Bornes fontaines', logicLayerId: 'fireHydrants' }
      ]
    }
  ]
};
