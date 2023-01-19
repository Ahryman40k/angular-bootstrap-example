import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.16');
let TAXONOMIES_COLLECTION: Collection;
/**
 * For V2.7.16 we need to add the taxonomy group infoRtuPartner.
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  const partnerTaxonomies = getInfoRtuPartnerTaxonomies();

  await upsertTaxonomies(partnerTaxonomies);
  await updateTaxonomies();

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.16 executed in ${milliseconds} milliseconds`);
}

async function upsertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`upsert assetType  ${TAXONOMIES_COLLECTION.collectionName}`);
  try {
    for (const taxonomy of taxonomies) {
      const setValue = {
        label: taxonomy.label
      };
      // tslint:disable:no-string-literal
      if (!isEmpty(taxonomy.properties)) {
        setValue['properties'] = taxonomy.properties;
      }
      await TAXONOMIES_COLLECTION.updateOne(
        { group: taxonomy.group, code: taxonomy.code },
        { $set: setValue },
        { upsert: true }
      );
    }
  } catch (e) {
    logger.error(`Create Service taxonomies error -> ${e}`);
  }
}

// tslint:disable-next-line: max-func-body-length
function getInfoRtuPartnerTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'infoRtuPartner',
      code: '48',
      label: {
        en: 'Les Ponts Jacques Cartier et Champlain Incorporée',
        fr: 'Les Ponts Jacques Cartier et Champlain Incorporée'
      },
      properties: {
        category: 'partner'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '10',
      label: {
        en: 'Ahuntsic-Cartierville',
        fr: 'Ahuntsic-Cartierville'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '11',
      label: {
        en: 'Anjou',
        fr: 'Anjou'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '12',
      label: {
        en: 'Côte-des-Neiges-Notre-Dame-de-Grâce',
        fr: 'Côte-des-Neiges-Notre-Dame-de-Grâce'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '17',
      label: {
        en: "L'Île-Bizard-Sainte-Geneviève",
        fr: "L'Île-Bizard-Sainte-Geneviève"
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '14',
      label: {
        en: 'LaSalle',
        fr: 'LaSalle'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '13',
      label: {
        en: 'Lachine',
        fr: 'Lachine'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '15',
      label: {
        en: 'Le Plateau Mont-Royal',
        fr: 'Le Plateau Mont-Royal'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '16',
      label: {
        en: 'Le Sud-Ouest',
        fr: 'Le Sud-Ouest'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '18',
      label: {
        en: 'Mercier-Hochelaga-Maisonneuve',
        fr: 'Mercier-Hochelaga-Maisonneuve'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '19',
      label: {
        en: 'Montréal-Nord',
        fr: 'Montréal-Nord'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '20',
      label: {
        en: 'Outremont',
        fr: 'Outremont'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '21',
      label: {
        en: 'Pierrefonds-Roxboro',
        fr: 'Pierrefonds-Roxboro'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '22',
      label: {
        en: 'Rivière des Prairies-Pointe-aux-Trembles',
        fr: 'Rivière des Prairies-Pointe-aux-Trembles'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '23',
      label: {
        en: 'Rosemont-La-Petite-Patrie',
        fr: 'Rosemont-La-Petite-Patrie'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '24',
      label: {
        en: 'Saint-Laurent',
        fr: 'Saint-Laurent'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '25',
      label: {
        en: 'Saint-Léonard',
        fr: 'Saint-Léonard'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '26',
      label: {
        en: 'Verdun',
        fr: 'Verdun'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '27',
      label: {
        en: 'Ville-Marie',
        fr: 'Ville-Marie'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '28',
      label: {
        en: 'Villeray-Saint-Michel-Parc-Extension',
        fr: 'Villeray-Saint-Michel-Parc-Extension'
      },
      properties: {
        category: 'borough'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '37',
      label: {
        en: 'Montréal-Est',
        fr: 'Montréal-Est'
      },
      properties: {
        category: 'city'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '39',
      label: {
        en: 'Mont-Royal',
        fr: 'Mont-Royal'
      },
      properties: {
        category: 'city'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '43',
      label: {
        en: 'Westmount',
        fr: 'Westmount'
      },
      properties: {
        category: 'city'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '34',
      label: {
        en: 'Hampstead',
        fr: 'Hampstead'
      },
      properties: {
        category: 'city'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '31',
      label: {
        en: 'Côte Saint-Luc',
        fr: 'Côte Saint-Luc'
      },
      properties: {
        category: 'city'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '38',
      label: {
        en: 'Montréal-Ouest',
        fr: 'Montréal-Ouest'
      },
      properties: {
        category: 'city'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '33',
      label: {
        en: 'Dorval',
        fr: 'Dorval'
      },
      properties: {
        category: 'city'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '40',
      label: {
        en: 'Pointe-Claire',
        fr: 'Pointe-Claire'
      },
      properties: {
        category: 'city'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '32',
      label: {
        en: 'Dollard-Des-Ormeaux',
        fr: 'Dollard-Des-Ormeaux'
      },
      properties: {
        category: 'city'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '35',
      label: {
        en: 'Kirkland',
        fr: 'Kirkland'
      },
      properties: {
        category: 'city'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '30',
      label: {
        en: 'Beaconsfield',
        fr: 'Beaconsfield'
      },
      properties: {
        category: 'city'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '29',
      label: {
        en: "Baie D'Urfé",
        fr: "Baie D'Urfé"
      },
      properties: {
        category: 'city'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '42',
      label: {
        en: 'Senneville',
        fr: 'Senneville'
      },
      properties: {
        category: 'city'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '41',
      label: {
        en: 'Sainte-Anne-de-Bellevue',
        fr: 'Sainte-Anne-de-Bellevue'
      },
      properties: {
        category: 'city'
      }
    }
  ];
}

const GROUP = 'infoRtuPartner';
const FIELD_PATH = 'properties';
const CODE_AND_VALUE = [
  {
    code: '52',
    value: {
      category: 'partner'
    }
  },
  {
    code: '03',
    value: {
      category: 'partner'
    }
  },
  {
    code: '51',
    value: {
      category: 'partner'
    }
  },
  {
    code: '04',
    value: {
      category: 'partner'
    }
  },
  {
    code: '05',
    value: {
      category: 'partner'
    }
  },
  {
    code: '02',
    value: {
      category: 'partner'
    }
  },
  {
    code: '44',
    value: {
      category: 'partner'
    }
  },
  {
    code: '06',
    value: {
      category: 'partner'
    }
  },
  {
    code: '46',
    value: {
      category: 'partner'
    }
  },
  {
    code: '08',
    value: {
      category: 'partner'
    }
  }
];

function getUpdateTaxonomies(): ITaxonomy[] {
  return CODE_AND_VALUE.map(item => {
    return {
      code: item.code,
      group: GROUP,
      properties: {
        category: item.value.category
      }
    } as ITaxonomy;
  });
}
export const taxos2716: ITaxonomy[] = [...getInfoRtuPartnerTaxonomies(), ...getUpdateTaxonomies()];

async function updateTaxonomies(): Promise<void> {
  logger.info('UPDATE TAXONOMIES STARTED');
  for (const codeAndValue of CODE_AND_VALUE) {
    logger.info(`Updating ${GROUP} with code ${codeAndValue.code}`);
    await TAXONOMIES_COLLECTION.updateOne(
      { group: GROUP, code: codeAndValue.code },
      {
        $set: {
          [FIELD_PATH]: codeAndValue.value
        }
      }
    );
  }
  logger.info('UPDATE TAXONOMIES DONE');
}
