import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';
import { isEmpty } from '../../../../utils/utils';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.7');
let TAXONOMIES_COLLECTION: Collection;
/**
 * For V2.7.7 we need to add the taxonomy group infoRtuPartner.
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  const partnerTaxonomies = getInfoRtuPartnerTaxonomies();
  const bridgeTaxonomies = getBridgeTaxonomies();
  const cityTaxonomies = getCityTaxonomies();

  await upsertTaxonomies(partnerTaxonomies);
  await upsertTaxonomies(bridgeTaxonomies);
  await upsertTaxonomies(cityTaxonomies);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.3 executed in ${milliseconds} milliseconds`);
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
      if (!isEmpty(taxonomy.displayOrder)) {
        setValue['displayOrder'] = taxonomy.displayOrder;
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

export const taxos277: ITaxonomy[] = [
  ...getBridgeTaxonomies(),
  ...getCityTaxonomies(),
  ...getInfoRtuPartnerTaxonomies()
];

function getInfoRtuPartnerTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'infoRtuPartner',
      code: '52',
      label: {
        en: 'Agence métropolitaine de transport',
        fr: 'Agence métropolitaine de transport'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '03',
      label: {
        en: 'Bell Canada',
        fr: 'Bell Canada'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '51',
      label: {
        en: 'Communauté métropolitaine de Montréal',
        fr: 'Communauté métropolitaine de Montréal'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '04',
      label: {
        en: 'CSEM',
        fr: 'CSEM'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '05',
      label: {
        en: 'Energir',
        fr: 'Énergir'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '02',
      label: {
        en: 'Hydro-Québec',
        fr: 'Hydro-Québec'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '44',
      label: {
        en: 'Hydro Westmount',
        fr: 'Hydro Westmount'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '06',
      label: {
        en: 'MTQ',
        fr: 'MTQ'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '46',
      label: {
        en: 'STM',
        fr: 'STM'
      }
    },
    {
      group: 'infoRtuPartner',
      code: '08',
      label: {
        en: 'Vidéotron',
        fr: 'Vidéotron'
      }
    }
  ];
}

// tslint:disable-next-line:max-func-body-length
function getCityTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'city',
      code: 'MTE',
      label: {
        en: 'Montréal-Est',
        fr: 'Montréal-Est'
      },
      properties: {
        rtuData: {
          id: '37074',
          name: 'Montréal-Est'
        }
      }
    },
    {
      group: 'city',
      code: 'MR',
      label: {
        en: 'Mont-Royal',
        fr: 'Mont-Royal'
      },
      properties: {
        rtuData: {
          id: '39001',
          name: 'Mont-Royal'
        }
      }
    },
    {
      group: 'city',
      code: 'WMT',
      label: {
        en: 'Westmount',
        fr: 'Westmount'
      },
      properties: {
        rtuData: {
          id: '43001',
          name: 'Westmount'
        }
      }
    },
    {
      group: 'city',
      code: 'HSD',
      label: {
        en: 'Hampstead',
        fr: 'Hampstead'
      },
      properties: {
        rtuData: {
          id: '34001',
          name: 'Hampstead'
        }
      }
    },
    {
      group: 'city',
      code: 'CSL',
      label: {
        en: 'Côte-Saint-Luc',
        fr: 'Côte-Saint-Luc'
      },
      properties: {
        rtuData: {
          id: '31001',
          name: 'Côte-Saint-Luc'
        }
      }
    },
    {
      group: 'city',
      code: 'MTO',
      label: {
        en: 'Montréal-Ouest',
        fr: 'Montréal-Ouest'
      },
      properties: {
        rtuData: {
          id: '38001',
          name: 'Montréal-Ouest'
        }
      }
    },
    {
      group: 'city',
      code: 'DVL',
      label: {
        en: 'Dorval',
        fr: 'Dorval'
      },
      properties: {
        rtuData: {
          id: '33001',
          name: 'Dorval'
        }
      }
    },
    {
      group: 'city',
      code: 'PC',
      label: {
        en: 'Pointe-Claire',
        fr: 'Pointe-Claire'
      },
      properties: {
        rtuData: {
          id: '40001',
          name: 'Pointe-Claire'
        }
      }
    },
    {
      group: 'city',
      code: 'DDO',
      label: {
        en: 'Dollard-des-Ormeaux',
        fr: 'Dollard-des-Ormeaux'
      },
      properties: {
        rtuData: {
          id: '32001',
          name: 'Dollard-des-Ormeaux'
        }
      }
    },
    {
      group: 'city',
      code: 'KLD',
      label: {
        en: 'Kirkland',
        fr: 'Kirkland'
      },
      properties: {
        rtuData: {
          id: '35001',
          name: 'Kirkland'
        }
      }
    },
    {
      group: 'city',
      code: 'BFD',
      label: {
        en: 'Beaconsfield',
        fr: 'Beaconsfield'
      },
      properties: {
        rtuData: {
          id: '30001',
          name: 'Beaconsfield'
        }
      }
    },
    {
      group: 'city',
      code: 'BDU',
      label: {
        en: 'Baie-d-Urfé',
        fr: 'Baie-d-Urfé'
      },
      properties: {
        rtuData: {
          id: '29001',
          name: "Baie-d'Urfé"
        }
      }
    },
    {
      group: 'city',
      code: 'SVL',
      label: {
        en: 'Senneville',
        fr: 'Senneville'
      },
      properties: {
        rtuData: {
          id: '42077',
          name: 'Senneville'
        }
      }
    },
    {
      group: 'city',
      code: 'SADB',
      label: {
        en: 'Sainte-Anne-de-Bellevue',
        fr: 'Sainte-Anne-de-Bellevue'
      },
      properties: {
        rtuData: {
          id: '41001',
          name: 'Sainte-Anne-de-Bellevue'
        }
      }
    }
  ];
}

function getBridgeTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'bridge',
      code: 'champlainBridge',
      label: {
        en: 'Champlain bridge',
        fr: 'Pont Champlain'
      },
      properties: {
        rtuData: {
          id: '48001',
          name: 'Pont Champlain'
        }
      }
    },
    {
      group: 'bridge',
      code: 'jacquesCartierBridge',
      label: {
        en: 'Jacques-Cartier Bridge',
        fr: 'Pont Jacques-Cartier'
      },
      properties: {
        rtuData: {
          id: '48002',
          name: 'Pont Jacques-Cartier'
        }
      }
    },
    {
      group: 'bridge',
      code: 'mercierBridge',
      label: {
        en: 'Mercier Bridge',
        fr: 'Pont Mercier'
      },
      properties: {
        rtuData: {
          id: '48003',
          name: 'Pont Mercier'
        }
      }
    }
  ];
}
