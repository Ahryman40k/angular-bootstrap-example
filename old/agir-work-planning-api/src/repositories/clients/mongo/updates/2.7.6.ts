import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { get } from 'lodash';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.6');
let TAXONOMIES_COLLECTION: Collection;
const nexoMatchKey = `properties.nexoMatches`;

export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await updateTaxonomies(taxos276);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.6 executed in ${milliseconds} milliseconds`);
}

async function updateTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  try {
    for (const taxonomy of taxonomies) {
      let setValue: any = {
        [nexoMatchKey]: get(taxonomy, nexoMatchKey)
      };
      if (taxonomy.label) {
        setValue = {
          ...setValue,
          label: taxonomy.label
        };
      }
      await TAXONOMIES_COLLECTION.updateOne(
        { group: taxonomy.group, code: taxonomy.code },
        {
          $set: setValue
        },
        { upsert: true }
      );
    }
  } catch (e) {
    logger.error(`Taxonomies Add nexoMatches -> ${e}`);
  }
}

const requestors: ITaxonomy[] = [
  {
    group: 'requestor',
    code: 'dre',
    properties: {
      nexoMatches: [
        {
          code: 'DRE-Section Sud',
          description: 'DRE-Section Sud'
        },
        {
          code: 'DRE-Section Nord',
          description: 'DRE-Section Nord'
        }
      ]
    }
  }
] as ITaxonomy[];

const boroughs: ITaxonomy[] = [
  {
    group: 'borough',
    code: 'AC',
    properties: {
      nexoMatches: [
        {
          code: 'Ahuntsic-Cartierville',
          description: 'Ahuntsic-Cartierville'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'ANJ',
    properties: {
      nexoMatches: [
        {
          code: 'Anjou',
          description: 'Anjou'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'CDNNDG',
    properties: {
      nexoMatches: [
        {
          code: 'Côte-des-Neiges–Notre-Dame-de-Grâce',
          description: 'Côte-des-Neiges–Notre-Dame-de-Grâce'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'IBZSGV',
    properties: {
      nexoMatches: [
        {
          code: 'L’Île-Bizard–Sainte-Geneviève',
          description: 'L’Île-Bizard–Sainte-Geneviève'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'LCH',
    properties: {
      nexoMatches: [
        {
          code: 'Lachine',
          description: 'Lachine'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'LSL',
    properties: {
      nexoMatches: [
        {
          code: 'LaSalle',
          description: 'LaSalle'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'PMR',
    properties: {
      nexoMatches: [
        {
          code: 'Le Plateau-Mont-Royal',
          description: 'Le Plateau-Mont-Royal'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'SO',
    properties: {
      nexoMatches: [
        {
          code: 'Le Sud-Ouest',
          description: 'Le Sud-Ouest'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'MHM',
    properties: {
      nexoMatches: [
        {
          code: 'Mercier–Hochelaga-Maisonneuve',
          description: 'Mercier–Hochelaga-Maisonneuve'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'MTN',
    properties: {
      nexoMatches: [
        {
          code: 'Montréal-Nord',
          description: 'Montréal-Nord'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'OUT',
    properties: {
      nexoMatches: [
        {
          code: 'Outremont',
          description: 'Outremont'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'PFDROX',
    properties: {
      nexoMatches: [
        {
          code: 'Pierrefonds-Roxboro',
          description: 'Pierrefonds-Roxboro'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'RDPPAT',
    properties: {
      nexoMatches: [
        {
          code: 'Rivière-des-Prairies–Pointe-aux-Trembles',
          description: 'Rivière-des-Prairies–Pointe-aux-Trembles'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'RPP',
    properties: {
      nexoMatches: [
        {
          code: 'Rosemont–La Petite-Patrie',
          description: 'Rosemont–La Petite-Patrie'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'SLR',
    properties: {
      nexoMatches: [
        {
          code: 'Saint-Laurent',
          description: 'Saint-Laurent'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'SLN',
    properties: {
      nexoMatches: [
        {
          code: 'Saint-Léonard',
          description: 'Saint-Léonard'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'VRD',
    properties: {
      nexoMatches: [
        {
          code: 'Verdun',
          description: 'Verdun'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'VM',
    properties: {
      nexoMatches: [
        {
          code: 'Ville-Marie',
          description: 'Ville-Marie'
        }
      ]
    }
  },
  {
    group: 'borough',
    code: 'VSMPE',
    properties: {
      nexoMatches: [
        {
          code: 'Villeray–Saint-Michel–Parc-Extension',
          description: 'Villeray–Saint-Michel–Parc-Extension'
        }
      ]
    }
  }
] as ITaxonomy[];

const assetTypes: ITaxonomy[] = [
  {
    group: 'assetType',
    code: 'sewerSegment',
    properties: {
      nexoMatches: [
        {
          code: '1',
          description: 'Égout sanitaire'
        },
        {
          code: '2',
          description: 'Égout pluvial'
        },
        {
          code: '3',
          description: 'Égout unitaire'
        }
      ]
    }
  },
  {
    group: 'assetType',
    code: 'aqueductSegment',
    properties: {
      nexoMatches: [
        {
          code: '4',
          description: 'Aqueduc'
        }
      ]
    }
  },
  {
    group: 'assetType',
    code: 'basin',
    properties: {
      nexoMatches: [
        {
          code: '5',
          description: 'Bassin'
        }
      ]
    }
  },
  {
    group: 'assetType',
    code: 'pumpingStation',
    properties: {
      nexoMatches: [
        {
          code: '6',
          description: 'Station pompage AQ'
        },
        {
          code: '7',
          description: 'Station pompage EG'
        }
      ]
    }
  },
  {
    group: 'assetType',
    code: 'aqueductValveChamber',
    properties: {
      nexoMatches: [
        {
          code: '8',
          description: 'Chambre de vanne'
        }
      ]
    }
  },
  {
    group: 'assetType',
    code: 'sewerManhole',
    properties: {
      nexoMatches: [
        {
          code: '9',
          description: `Regard d'égout`
        }
      ]
    }
  }
] as ITaxonomy[];

const workTypes: ITaxonomy[] = [
  {
    group: 'workType',
    code: 'reconstruction',
    properties: {
      nexoMatches: [
        {
          code: '1',
          description: 'Reconstruction'
        }
      ]
    }
  },
  {
    group: 'workType',
    code: 'rehabilitation',
    properties: {
      nexoMatches: [
        {
          code: '2',
          description: 'Réhabilitation'
        }
      ]
    }
  },
  {
    group: 'workType',
    code: 'construction',
    properties: {
      nexoMatches: [
        {
          code: '3',
          description: 'Construction'
        },
        {
          code: '4',
          description: 'Entrées service'
        }
      ]
    }
  }
] as ITaxonomy[];

const executors: ITaxonomy[] = [
  {
    group: 'executor',
    code: 'di',
    properties: {
      nexoMatches: [
        {
          code: '1',
          description: 'DI'
        }
      ]
    }
  },
  {
    group: 'executor',
    code: 'dre',
    label: {
      fr: 'DRE',
      en: 'DRE'
    },
    properties: {
      nexoMatches: [
        {
          code: '2',
          description: 'DRE'
        }
      ]
    }
  },
  {
    group: 'executor',
    code: 'borough',
    properties: {
      nexoMatches: [
        {
          code: '3',
          description: 'Arron.'
        }
      ]
    }
  },
  {
    group: 'executor',
    code: 'dep',
    properties: {
      nexoMatches: [
        {
          code: '4',
          description: 'DEP'
        }
      ]
    }
  },
  {
    group: 'executor',
    code: 'deeu',
    properties: {
      nexoMatches: [
        {
          code: '5',
          description: 'DEEU'
        }
      ]
    }
  },
  {
    group: 'executor',
    code: 'other',
    properties: {
      nexoMatches: [
        {
          code: '6',
          description: 'Autres'
        }
      ]
    }
  }
] as ITaxonomy[];

const roadNetworkTypes: ITaxonomy[] = [
  {
    group: 'roadNetworkType',
    code: 'local',
    properties: {
      nexoMatches: [
        {
          code: '0',
          description: 'Local'
        }
      ]
    }
  },
  {
    group: 'roadNetworkType',
    code: 'arterial',
    properties: {
      nexoMatches: [
        {
          code: '1',
          description: 'Artériel'
        }
      ]
    }
  }
] as ITaxonomy[];

export const taxos276: ITaxonomy[] = [
  ...requestors,
  ...boroughs,
  ...assetTypes,
  ...workTypes,
  ...executors,
  ...roadNetworkTypes
];
