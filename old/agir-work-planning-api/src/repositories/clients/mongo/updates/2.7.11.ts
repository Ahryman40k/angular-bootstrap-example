import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.11');

/**
 * For V2.7.11 we need to update the taxonomy group boroughs.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();
    await updateTaxonomies(db);
    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.11 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

const GROUP = 'borough';
const FIELD_PATH = 'properties.rtuData';
const CODE_AND_VALUE = [
  {
    code: 'AC',
    value: {
      id: '10001',
      name: 'Ahuntsic-Cartierville'
    }
  },
  {
    code: 'ANJ',
    value: {
      id: '11001',
      name: 'Anjou'
    }
  },
  {
    code: 'CDNNDG',
    value: {
      id: '12001',
      name: 'Côte-des-Neiges-Notre-Dame-de-Grâce'
    }
  },
  {
    code: 'IBZSGV',
    value: {
      id: '17001',
      name: 'L-Île-Bizard-Sainte-Geneviève'
    }
  },
  {
    code: 'LSL',
    value: {
      id: '14001',
      name: 'LaSalle'
    }
  },
  {
    code: 'LCH',
    value: {
      id: '13001',
      name: 'Lachine'
    }
  },
  {
    code: 'PMR',
    value: {
      id: '15001',
      name: 'Plateau-Mont-Royal'
    }
  },
  {
    code: 'SO',
    value: {
      id: '16001',
      name: 'Sud-Ouest'
    }
  },
  {
    code: 'MHM',
    value: {
      id: '18001',
      name: 'Mercier-Hochelaga-Maisonneuve'
    }
  },
  {
    code: 'MTN',
    value: {
      id: '19001',
      name: 'Montréal-Nord'
    }
  },
  {
    code: 'OUT',
    value: {
      id: '20001',
      name: 'Outremont'
    }
  },
  {
    code: 'PFDROX',
    value: {
      id: '21001',
      name: 'Pierrefonds-Roxboro'
    }
  },
  {
    code: 'RDPPAT',
    value: {
      id: '22001',
      name: 'Rivière-des-Prairies-Pointe-aux-Trembles'
    }
  },
  {
    code: 'RPP',
    value: {
      id: '23001',
      name: 'Rosemont-Petite-Patrie'
    }
  },
  {
    code: 'SLR',
    value: {
      id: '24001',
      name: 'Saint-Laurent'
    }
  },
  {
    code: 'SLN',
    value: {
      id: '25001',
      name: 'Saint-Léonard'
    }
  },
  {
    code: 'VRD',
    value: {
      id: '26001',
      name: 'Verdun'
    }
  },
  {
    code: 'VM',
    value: {
      id: '27001',
      name: 'Ville-Marie'
    }
  },
  {
    code: 'VSMPE',
    value: {
      id: '28001',
      name: 'Villeray-Saint-Michel-Parc-Extension'
    }
  }
];

export const taxos2711 = getBoroughTaxonomies();

function getBoroughTaxonomies(): ITaxonomy[] {
  return CODE_AND_VALUE.map(item => {
    return {
      code: item.code,
      group: 'borough',
      properties: {
        rtuData: {
          id: item.value.id,
          name: item.value.name
        }
      }
    } as ITaxonomy;
  });
}

async function updateTaxonomies(db: MongoDb.Db): Promise<void> {
  logger.info('UPDATE TAXONOMIES STARTED');
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  for (const codeAndValue of CODE_AND_VALUE) {
    logger.info(`Updating ${GROUP} with code ${codeAndValue.code}`);
    await taxonomiesCollection.updateOne(
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
