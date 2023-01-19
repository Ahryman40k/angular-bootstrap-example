import { ILayerManagerConfig } from '../../../../gis-components-lib/src/lib/models/layer-manager';

export const layerManagerConfig: ILayerManagerConfig = {
  theme: 'bootstrap-theme',
  layerGroups: [
    // {
    // label: 'Montréal',
    // layerGroups: [
    {
      label: 'Actifs',
      layers: [
        { label: 'Arbres sur rue', logicLayerId: 'streetTrees' },
        { label: 'Bornes fontaines', logicLayerId: 'fireHydrants' }
      ]
    },
    {
      label: 'Stationnement',
      layers: [
        { label: 'Bornes de paiement', logicLayerId: 'bornesDePaiement' },
        { label: 'Parcomètres', logicLayerId: 'parcometres' }
      ]
    },
    {
      label: 'Signalisation',
      layers: [
        { label: 'Arrêts interdits', logicLayerId: 'arretInterdit' },
        { label: 'Poteaux', logicLayerId: 'poteaux' }
      ]
    },
    {
      label: 'Permis',
      layers: [{ label: "Permis d'occupation temporaire du territoire", logicLayerId: 'permits' }]
    },
    {
      label: 'Contrats',
      layers: [{ label: 'Contrats de gestion des déchets', logicLayerId: 'zoningWaste' }]
    }
    // {
    //   label: "Plan d'intervention 2016",
    //   layerGroups: [
    //     {
    //       label: 'Eau',
    //       layers: [
    //         { label: 'Eau potable', logicLayerId: 'pi2016PotableWater' },
    //         { label: 'Égouts pluviaux', logicLayerId: 'pi2016RainWater' },
    //         { label: 'Égouts sanitaires', logicLayerId: 'pi2016WasteWater' }
    //       ]
    //     },
    //     {
    //       label: 'Transport',
    //       layers: [
    //         { label: 'Réseau routier', logicLayerId: 'pi2016RoadNetwork' },
    //         { label: 'Noeuds', logicLayerId: 'pi2016RoadNodes' },
    //         { label: 'Tronçons', logicLayerId: 'pi2016RoadSections' }
    //       ]
    //     }
    //   ]
    // }
  ]
  // }
  // ]
};
