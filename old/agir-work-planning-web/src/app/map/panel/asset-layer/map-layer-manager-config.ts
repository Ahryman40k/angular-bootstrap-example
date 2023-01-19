import { Observable } from 'rxjs';
import { LayerManagerSubGroupIds, LayerManagerSubGroupIdsType } from 'src/app/shared/models/assets/asset-layer-group';
import { LayerManagerGroupIds } from 'src/app/shared/models/assets/layer-manager-group-ids-enum';
import { MapLogicLayer } from '../../config/layers/logic-layers/map-logic-layer-enum';

export const mapLayersVisibleByDefault: MapLogicLayer[] = [MapLogicLayer.countByBorough];
const iconType = {
  iconRoadway: 'icon-roadway',
  iconAqueduct: 'icon-aqueduct',
  iconHospital: 'icon-hospital'
};
export const mapLayerManagerConfig: ILayerManagerConfig = {
  layersType: [
    {
      id: 'actifs',
      title: 'Actifs',
      groups: [
        {
          groupId: LayerManagerGroupIds.AQUEDUCTS,
          groupTitle: 'Aqueducs',
          link: LayerManagerGroupIds.AQUEDUCTS,
          subGroups: [
            {
              subGroupId: LayerManagerSubGroupIds.AQUEDUCTS,
              layers: [
                {
                  layerId: LayerManagerGroupIds.AQUEDUCT_ACCESSORY,
                  layerName: "Accessoires d'aqueducs",
                  icon: 'icon-aqueduct-accessory',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.AQUEDUCTS,
                  layerName: 'Aqueducs',
                  icon: iconType.iconAqueduct,
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.LEAD_GROUND,
                  layerName: "Entrées d'eau en plomb (Terrains plomb)",
                  icon: 'icon-lead-ground',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.AQUEDUCT_ENTRANCE_SEGMENTS,
                  layerName: "Segment d'entrée de service",
                  icon: iconType.iconAqueduct,
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.AQUEDUCT_JOINS,
                  layerName: 'Raccords aqueduc',
                  icon: 'icon-aqueduct-joins',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.AQUEDUCT_VALVES,
                  layerName: "Vannes d'aqueduc",
                  icon: 'icon-aqueduct-valves',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.AQUEDUCT_VALVE_CHAMBERS,
                  layerName: "Chambre de vanne d'aqueduc",
                  icon: 'icon-aqueduct-valve-chambers',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.FIRE_HYDRANTS,
                  layerName: "Borne d'incendies",
                  icon: 'icon-fire-hydrants',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.WATER_ENTRANCE_SERVICE,
                  layerName: "Entrées de services d'eau",
                  icon: 'icon-water-service-entrance',
                  isVisible: false
                }
              ]
            }
          ]
        },
        {
          groupId: LayerManagerGroupIds.SEWERS,
          groupTitle: 'Égouts',
          link: LayerManagerGroupIds.SEWERS,
          subGroups: [
            {
              subGroupId: LayerManagerSubGroupIds.EGOUTS,
              layers: [
                {
                  layerId: LayerManagerGroupIds.SEWERS_ACCESSOIRIES,
                  layerName: "Accessoires d'égouts",
                  icon: 'icon-sewer-accessory',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.SEWERS,
                  layerName: 'Égouts',
                  icon: 'icon-sewers',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.SEWER_CHAMBERS,
                  layerName: "Chambres d'égout",
                  icon: 'icon-sewer-chambers',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.SEWER_MANHOLE,
                  layerName: "Regards d'égouts",
                  icon: 'icon-sewer-manhole',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.SEWER_JOINS,
                  layerName: "Raccord d'égouts",
                  icon: 'icon-sewer-joins',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.SEWER_SUMPS,
                  layerName: 'Puisards',
                  icon: 'icon-sewer-sumps',
                  isVisible: false
                }
              ]
            }
          ]
        },
        {
          groupId: LayerManagerGroupIds.ENERGY,
          groupTitle: 'Énergie',
          link: LayerManagerGroupIds.ENERGY,
          subGroups: [
            {
              subGroupId: LayerManagerSubGroupIds.CSEM,
              subGroupTitle: 'Commission des services électriques de Montréal (CSEM)',
              layers: [
                {
                  layerId: LayerManagerGroupIds.CSEM_MASSIVES,
                  layerName: 'Massifs',
                  icon: 'icon-csem-massifs',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.CSEM_STRUCTURES,
                  layerName: 'Structures',
                  icon: 'icon-csem-structures',
                  isVisible: false
                }
              ]
            },
            {
              subGroupId: LayerManagerSubGroupIds.GAS,
              subGroupTitle: 'Énergir',
              layers: [
                {
                  layerId: LayerManagerGroupIds.GAS,
                  layerName: 'Énergir',
                  icon: 'icon-gaz',
                  isVisible: false
                }
              ]
            },
            {
              subGroupId: LayerManagerSubGroupIds.HYDRO,
              subGroupTitle: 'Hydro-Québec',
              layers: [
                {
                  layerId: LayerManagerGroupIds.HYDRO_LINE,
                  layerName: 'Lignes Hydro-Québec',
                  icon: 'icon-energy-line',
                  isVisible: false,
                  nestedLayers: [
                    {
                      layerId: '',
                      layerName: 'Aérienne',
                      icon: 'icon-energy-line-aerial',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'Souterraine',
                      icon: 'icon-energy-line-underground',
                      isVisible: true
                    }
                  ]
                },
                {
                  layerId: LayerManagerGroupIds.HYDRO_SUBSTATION,
                  layerName: 'Postes Hydro-Québec',
                  icon: 'icon-hydro-substation',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.PYLON,
                  layerName: 'Pylônes',
                  icon: 'icon-hydro-pylon',
                  isVisible: false
                }
              ]
            }
          ]
        },
        {
          groupId: LayerManagerGroupIds.HYDROGRAPHY,
          groupTitle: 'Hydrographiques',
          link: LayerManagerGroupIds.HYDROGRAPHY,
          subGroups: [
            {
              subGroupId: LayerManagerSubGroupIds.HYDROGRAPHY,
              layers: [
                {
                  layerId: LayerManagerGroupIds.WATERCOURSES_DITCHES,
                  layerName: "Cours d'eau et fossés",
                  icon: 'icon-watercourse-ditche',
                  isVisible: false,
                  nestedLayers: [
                    {
                      layerId: '',
                      layerName: 'Fossé',
                      icon: 'icon-ditche',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'Rivière',
                      icon: 'icon-river',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'Ruisseau',
                      icon: 'icon-river',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'Ruisseau-canal',
                      icon: 'icon-stream-canal',
                      isVisible: true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          groupId: LayerManagerGroupIds.ROADWAYS,
          groupTitle: 'Voirie',
          link: LayerManagerGroupIds.ROADWAYS,
          subGroups: [
            {
              subGroupId: LayerManagerSubGroupIds.ROADWAYS,
              layers: [
                {
                  layerId: LayerManagerGroupIds.ROADWAYS,
                  layerName: 'Chaussées',
                  icon: iconType.iconRoadway,
                  isVisible: false,
                  nestedLayers: [
                    {
                      layerId: LayerManagerGroupIds.ROADWAYS,
                      layerName: 'Chaussées',
                      icon: iconType.iconRoadway,
                      isVisible: true
                    },
                    {
                      layerId: LayerManagerGroupIds.ILOTS,
                      layerName: 'Ilôts',
                      icon: 'icon-sidewalk',
                      isVisible: true
                    },
                    {
                      layerId: LayerManagerGroupIds.INTERSECTIONS,
                      layerName: 'Intersections',
                      icon: iconType.iconRoadway,
                      isVisible: true
                    }
                  ]
                },
                {
                  layerId: LayerManagerGroupIds.SIDEWALK,
                  layerName: 'Trottoirs',
                  icon: 'icon-sidewalk',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.AREA,
                  layerName: 'Zones',
                  icon: 'icon-area',
                  isVisible: false
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'reseauRoutier',
      title: 'Réseau Routier',
      groups: [
        {
          groupId: LayerManagerGroupIds.MOBILITY,
          groupTitle: 'Mobilité',
          link: LayerManagerGroupIds.MOBILITY,
          subGroups: [
            {
              subGroupId: LayerManagerSubGroupIds.MOBILITY,
              layers: [
                {
                  layerId: LayerManagerGroupIds.ROAD_NETWORK_ARTERIAL,
                  layerName: 'Réseau Artériel Administratif de la Ville (RAAV)',
                  icon: 'icon-road-network-arterial',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.ROAD_NETWORK_NODES,
                  layerName: 'Noeuds de réseau routier',
                  icon: 'icon-road-network-node',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.UNIFIED_SECTIONS,
                  layerName: 'Tronçons unifiés',
                  icon: 'icon-unified-sections',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.HIGHWAYS,
                  layerName: 'Autoroutes',
                  icon: 'icon-highways',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.MOBILITY_AXIS,
                  layerName: 'Axes de mobilité',
                  icon: 'icon-mobility-axis',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.ALLEYS,
                  layerName: 'Ruelles',
                  icon: 'icon-alleys',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.FLOW_DIRECTION,
                  layerName: 'Sens de Circulation',
                  icon: 'icon-flow-direction',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.REVISION_ROAD_NETWORKS,
                  layerName: 'Réseaux en revision (voirie)',
                  icon: 'icon-revision-road-networks',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.SHOPPING_STREET,
                  layerName: 'Rues commerçantes',
                  icon: 'icon-shopping-street',
                  isVisible: false
                }
              ]
            },
            {
              subGroupId: LayerManagerSubGroupIds.SNOW,
              subGroupTitle: 'Neige',
              layers: [
                {
                  layerId: LayerManagerGroupIds.SENSITIVE_SITE,
                  layerName: 'Sites sensibles',
                  icon: 'icon-sensitive-site',
                  isVisible: false,
                  nestedLayers: [
                    {
                      layerId: '',
                      layerName: 'Centre de réadaptation en alcoolisme et autres toxicomanies (CRPAT)',
                      icon: iconType.iconHospital,
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'Centre de réadaptation en déficience intellectuelle (CRDI)',
                      icon: iconType.iconHospital,
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'Centre de réadaptation en déficience physique (CRDP)',
                      icon: iconType.iconHospital,
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: "Centre de réadaptation pour les jeunes en difficulté d'adaptation (CRJDA)",
                      icon: iconType.iconHospital,
                      isVisible: true
                    }
                  ]
                },
                {
                  layerId: LayerManagerGroupIds.SEWER_DROP,
                  layerName: "Chute à l'égoût",
                  icon: 'icon-sewer-drop',
                  isVisible: false
                }
              ]
            }
          ]
        },
        {
          groupId: LayerManagerGroupIds.TRANSPORT,
          groupTitle: 'Transport',
          link: LayerManagerGroupIds.TRANSPORT,
          subGroups: [
            {
              subGroupId: LayerManagerSubGroupIds.TRANSPORT,
              layers: [
                {
                  layerId: LayerManagerGroupIds.BIKE_PATHS,
                  layerName: 'Pistes cyclables',
                  icon: 'icon-bike-paths',
                  isVisible: false
                }
              ]
            },
            {
              subGroupId: LayerManagerSubGroupIds.RAILWAY,
              subGroupTitle: 'Ferroviaire',
              layers: [
                {
                  layerId: LayerManagerGroupIds.TRACK,
                  layerName: 'Voies ferrées',
                  icon: 'icon-track',
                  isVisible: false
                }
              ]
            },
            {
              subGroupId: LayerManagerSubGroupIds.BUS,
              subGroupTitle: 'Autobus',
              layers: [
                {
                  layerId: LayerManagerGroupIds.BUS_STOP,
                  layerName: 'Arrêts de bus',
                  icon: 'icon-bus-stop',
                  isVisible: false
                },
                {
                  layerId: LayerManagerGroupIds.BUS_LINE,
                  layerName: 'Ligne de bus',
                  icon: 'icon-bus-line',
                  isVisible: false
                }
              ]
            },
            {
              subGroupId: LayerManagerSubGroupIds.SUBWAY,
              subGroupTitle: 'Métro',
              layers: [
                {
                  layerId: LayerManagerGroupIds.UNDERGROUND_LINE,
                  layerName: 'Lignes de métro',
                  icon: 'icon-subway-line',
                  isVisible: false,
                  nestedLayers: [
                    {
                      layerId: '',
                      layerName: 'Ligne 1',
                      icon: 'icon-subway-line-1',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'Ligne 2',
                      icon: 'icon-subway-line-2',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'Ligne 4',
                      icon: 'icon-subway-line-4',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'Ligne 5',
                      icon: 'icon-subway-line-5',
                      isVisible: true
                    }
                  ]
                },
                {
                  layerId: LayerManagerGroupIds.METRO_STATION,
                  layerName: 'Stations de métro',
                  icon: 'icon-subway-station',
                  isVisible: false
                }
              ]
            },
            {
              subGroupId: LayerManagerSubGroupIds.REM,
              subGroupTitle: 'REM',
              layers: [
                {
                  layerId: LayerManagerGroupIds.REM_STATION,
                  layerName: 'REM Stations',
                  icon: 'icon-rem-station',
                  isVisible: false
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'surface',
      title: 'Surface',
      groups: [
        {
          groupId: LayerManagerGroupIds.LIGHTNING,
          groupTitle: 'Éclairage',
          link: LayerManagerGroupIds.LIGHTNING,
          subGroups: [
            {
              subGroupId: LayerManagerSubGroupIds.LIGHTNING,
              subGroupTitle: '',
              layers: [
                {
                  layerId: LayerManagerGroupIds.CABLE,
                  layerName: 'Câble',
                  isVisible: false,
                  icon: 'icon-cable'
                },
                {
                  layerId: LayerManagerGroupIds.BARREL,
                  layerName: 'Fût',
                  isVisible: false,
                  icon: 'icon-barrel'
                }
              ]
            }
          ]
        },
        {
          groupId: LayerManagerGroupIds.FURNITURE,
          groupTitle: 'Mobilier',
          link: LayerManagerGroupIds.FURNITURE,
          subGroups: [
            {
              subGroupId: LayerManagerSubGroupIds.FURNITURE,
              subGroupTitle: '',
              layers: [
                {
                  layerId: LayerManagerGroupIds.BUS_SHELTER,
                  layerName: 'Abribus',
                  isVisible: false,
                  icon: '',
                  nestedLayers: [
                    {
                      layerId: '',
                      layerName: 'Québécor',
                      icon: 'icon-bus-shelter-quebecor',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'Privé',
                      icon: 'icon-bus-shelter-private',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'Ville',
                      icon: 'icon-bus-shelter-city',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'STM',
                      icon: 'icon-bus-shelter-stm',
                      isVisible: true
                    }
                  ]
                }
              ]
            },
            {
              subGroupId: LayerManagerSubGroupIds.HORTICULTURE,
              subGroupTitle: 'Horticulture',
              layers: [
                {
                  layerId: LayerManagerGroupIds.STREET_TREE,
                  layerName: 'Arbres sur rue',
                  isVisible: false,
                  icon: '',
                  nestedLayers: [
                    {
                      layerId: '',
                      layerName: 'F',
                      icon: 'icon-tree',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'C',
                      icon: 'icon-pine-tree',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'P',
                      icon: 'icon-street-tree-p',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'VI',
                      icon: 'icon-street-tree-vi',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'VA',
                      icon: 'icon-street-tree-va',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'VP',
                      icon: 'icon-street-tree-vp',
                      isVisible: true
                    }
                  ]
                }
              ]
            }
          ]
        },

        {
          groupId: LayerManagerGroupIds.SIGNALIZATION,
          groupTitle: 'Signalisation',
          link: LayerManagerGroupIds.SIGNALIZATION,
          subGroups: [
            {
              subGroupId: LayerManagerSubGroupIds.TERMINALS,
              subGroupTitle: 'Bornes',
              layers: [
                {
                  layerId: LayerManagerGroupIds.ELECTRICAL_TERMINAL,
                  layerName: 'Bornes de recharge',
                  isVisible: false,
                  icon: 'icon-charging-station'
                }
              ]
            },
            {
              subGroupId: LayerManagerSubGroupIds.POLES,
              subGroupTitle: 'Poteaux',
              layers: [
                {
                  layerId: LayerManagerGroupIds.POLES,
                  layerName: 'Poteaux',
                  isVisible: false,
                  icon: 'icon-pole'
                },
                {
                  layerId: LayerManagerGroupIds.INT_LOGICAL,
                  layerName: 'Int Logiques (noeuds)',
                  isVisible: false,
                  icon: '',
                  nestedLayers: [
                    {
                      layerId: '',
                      layerName: 'Feu avec contrôleur',
                      icon: 'icon-light-controller',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'Feu sans contrôleur',
                      icon: 'icon-light-no-controller',
                      isVisible: true
                    },
                    {
                      layerId: '',
                      layerName: 'Intersection sans feu',
                      icon: 'icon-light-no',
                      isVisible: true
                    }
                  ]
                },
                {
                  layerId: LayerManagerGroupIds.TRAFFIC_LIGHT,
                  layerName: 'Feux de circulation int',
                  isVisible: false,
                  icon: 'icon-traffic-light'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'territoire',
      title: 'Territoire',
      groups: [
        {
          groupId: LayerManagerGroupIds.BUILDINGS_LOCATIONS,
          groupTitle: 'Bâtiments et lieux',
          link: LayerManagerGroupIds.BUILDINGS_LOCATIONS,
          subGroups: [
            {
              subGroupId: LayerManagerSubGroupIds.BUILDINGS_LOCATIONS,
              subGroupTitle: '',
              layers: [
                {
                  layerId: LayerManagerGroupIds.WATER_POINT,
                  layerName: "Point d'eau",
                  isVisible: false,
                  icon: 'icon-water-point'
                },
                {
                  layerId: LayerManagerGroupIds.GREEN_SPACE,
                  layerName: 'Espaces Verts',
                  isVisible: false,
                  icon: 'icon-green-space'
                }
              ]
            }
          ]
        },
        {
          groupId: LayerManagerGroupIds.PUBLIC_DOMAIN,
          groupTitle: 'Domaine public',
          link: LayerManagerGroupIds.PUBLIC_DOMAIN,
          subGroups: [
            {
              subGroupId: LayerManagerSubGroupIds.PUBLIC_DOMAIN,
              subGroupTitle: '',
              layers: [
                {
                  layerId: LayerManagerGroupIds.LEGAL_CADASTRE,
                  layerName: 'Cadastre légal',
                  isVisible: false,
                  icon: 'icon-legal-cadastre'
                },
                {
                  layerId: LayerManagerGroupIds.LOT_NUMBER,
                  layerName: 'Numéros de lots',
                  isVisible: false,
                  icon: 'icon-lot-number'
                }
              ]
            }
          ]
        },
        {
          groupId: LayerManagerGroupIds.ANALYSIS_ELEMENTS,
          groupTitle: "Éléments d'analyse",
          link: LayerManagerGroupIds.ANALYSIS_ELEMENTS,
          subGroups: [
            {
              subGroupId: LayerManagerSubGroupIds.INTERVENTION_PLAN_2016,
              subGroupTitle: 'Plan intervention 2016',
              layers: [
                {
                  layerId: LayerManagerGroupIds.DRINKING_WATER,
                  layerName: 'Eau Potable',
                  isVisible: false,
                  icon: 'icon-potable-water'
                },
                {
                  layerId: LayerManagerGroupIds.WASTE_WATERS,
                  layerName: 'Eaux usées',
                  isVisible: false,
                  icon: 'icon-waste-water'
                },
                {
                  layerId: LayerManagerGroupIds.RAINY_WATERS,
                  layerName: 'Eaux pluviales',
                  isVisible: false,
                  icon: 'icon-rainy-water'
                },
                {
                  layerId: LayerManagerGroupIds.UNIFIED_NODES,
                  layerName: 'Noeud_PI(noeuds-unifiés)',
                  isVisible: false,
                  icon: 'icon-unified-node'
                },
                {
                  layerId: LayerManagerGroupIds.ROAD,
                  layerName: 'Voirie',
                  isVisible: false,
                  icon: 'icon-road-line'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export const assetIconsWithoutLayerFilter = {
  aqueductSegment: 'icon-aqueduct',
  park: 'icon-park',
  'roadway-intersection': 'icon-roadway',
  sewerSegment: 'icon-sewer-segment'
};

export const GLOBAL_LAYER_STORAGE_KEY = 'global-layer-service-key';

export interface ILayerManagerConfig {
  layersType: ILayerType[];
}

export interface ILayerType {
  id: string;
  title: string;
  groups: ILayerGroup[];
}

export interface ILayerGroup {
  groupId: string;
  groupTitle: string;
  link: string;
  isActive$?: Observable<boolean>;
  subGroups: ILayerSubGroup[];
}

export interface ILayerSubGroup {
  layers: ILayer[];
  subGroupId?: LayerManagerSubGroupIdsType;
  subGroupTitle?: string;
}

export interface ILayer {
  disableRuntime?: boolean;
  icon?: string;
  isActive$?: Observable<boolean>;
  isVisible: boolean;
  layerId: string;
  layerName: string;
  taxonomyGroup?: string;
  themeId?: string;
  nestedLayers?: ILayer[];
}
