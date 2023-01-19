import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.8');

/**
 * For V2.7.8 we need to update the taxonomy group boroughs.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();
    await updateTaxonomies(db);
    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.8 executed in ${milliseconds} milliseconds`);
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
      name: 'Arrondissement Ahuntsic-Cartierville'
    }
  },
  {
    code: 'ANJ',
    value: {
      id: '11001',
      name: 'Arrondissement Anjou'
    }
  },
  {
    code: 'CDNNDG',
    value: {
      id: '12001',
      name: 'Arrondissement Côte-des-Neiges-Notre-Dame-de-Grâce'
    }
  },
  {
    code: 'IBZSGV',
    value: {
      id: '17001',
      name: 'Arrondissement L-Île-Bizard-Sainte-Geneviève'
    }
  },
  {
    code: 'LSL',
    value: {
      id: '14001',
      name: 'Arrondissement LaSalle'
    }
  },
  {
    code: 'LCH',
    value: {
      id: '13001',
      name: 'Arrondissement Lachine'
    }
  },
  {
    code: 'PMR',
    value: {
      id: '15001',
      name: 'Arrondissement Plateau-Mont-Royal'
    }
  },
  {
    code: 'SO',
    value: {
      id: '16001',
      name: 'Arrondissement Sud-Ouest'
    }
  },
  {
    code: 'MHM',
    value: {
      id: '18001',
      name: 'Arrondissement Mercier-Hochelaga-Maisonneuve'
    }
  },
  {
    code: 'MTN',
    value: {
      id: '19001',
      name: 'Arrondissement Montréal-Nord'
    }
  },
  {
    code: 'OUT',
    value: {
      id: '20001',
      name: 'Arrondissement Outremont'
    }
  },
  {
    code: 'PFDROX',
    value: {
      id: '21001',
      name: 'Arrondissement Pierrefonds-Roxboro'
    }
  },
  {
    code: 'RDPPAT',
    value: {
      id: '22001',
      name: 'Arrondissement Rivière-des-Prairies-Pointe-aux-Trembles'
    }
  },
  {
    code: 'RPP',
    value: {
      id: '23001',
      name: 'Arrondissement Rosemont-Petite-Patrie'
    }
  },
  {
    code: 'SLR',
    value: {
      id: '24001',
      name: 'Arrondissement Saint-Laurent'
    }
  },
  {
    code: 'SLN',
    value: {
      id: '25001',
      name: 'Arrondissement Saint-Léonard'
    }
  },
  {
    code: 'VRD',
    value: {
      id: '26001',
      name: 'Arrondissement Verdun'
    }
  },
  {
    code: 'VM',
    value: {
      id: '27001',
      name: 'Arrondissement Ville-Marie'
    }
  },
  {
    code: 'VSMPE',
    value: {
      id: '28001',
      name: 'Arrondissement Villeray-Saint-Michel-Parc-Extension'
    }
  }
];

export const taxos278 = getBoroughTaxonomies();

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
