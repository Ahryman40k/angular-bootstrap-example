import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.53');

/**
 * For V2.7.53 we need to update the taxonomy group boroughs.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();
    await updateTaxonomies(db);
    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.53 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

const FIELD_PATH = 'properties.rrvaNumArrPti';
const BOROUGH_CODE_AND_VALUE = [
  {
    group: TaxonomyGroup.borough,
    code: 'RDPPAT',
    properties: {
      rrvaNumArrPti: '19'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'PMR',
    properties: {
      rrvaNumArrPti: '22'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'AC',
    properties: {
      rrvaNumArrPti: '24'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'IBZSGV',
    properties: {
      rrvaNumArrPti: '6'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'VM',
    properties: {
      rrvaNumArrPti: '20'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'CDNNDG',
    properties: {
      rrvaNumArrPti: '27'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'SLN',
    properties: {
      rrvaNumArrPti: '14'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'LCH',
    properties: {
      rrvaNumArrPti: '17'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'OUT',
    properties: {
      rrvaNumArrPti: '5'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'ANJ',
    properties: {
      rrvaNumArrPti: '9'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'VRD',
    properties: {
      rrvaNumArrPti: '12'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'SO',
    properties: {
      rrvaNumArrPti: '21'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'LSL',
    properties: {
      rrvaNumArrPti: '18'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'RPP',
    properties: {
      rrvaNumArrPti: '25'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'MTN',
    properties: {
      rrvaNumArrPti: '16'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'PFDROX',
    properties: {
      rrvaNumArrPti: '13'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'MHM',
    properties: {
      rrvaNumArrPti: '23'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'VSMPE',
    properties: {
      rrvaNumArrPti: '26'
    }
  },
  {
    group: TaxonomyGroup.borough,
    code: 'SLR',
    properties: {
      rrvaNumArrPti: '15'
    }
  }
];
const CITY_CODE_AND_VALUE = [
  {
    group: TaxonomyGroup.city,
    code: 'MTE',
    properties: {
      rrvaNumArrPti: '74'
    }
  },
  {
    group: TaxonomyGroup.city,
    code: 'MR',
    properties: {
      rrvaNumArrPti: '2'
    }
  },
  {
    group: TaxonomyGroup.city,
    code: 'WMT',
    properties: {
      rrvaNumArrPti: '4'
    }
  },
  {
    group: TaxonomyGroup.city,
    code: 'HSD',
    properties: {
      rrvaNumArrPti: '10'
    }
  },
  {
    group: TaxonomyGroup.city,
    code: 'CSL',
    properties: {
      rrvaNumArrPti: '72'
    }
  },
  {
    group: TaxonomyGroup.city,
    code: 'MTO',
    properties: {
      rrvaNumArrPti: '75'
    }
  },
  {
    group: TaxonomyGroup.city,
    code: 'DVL',
    properties: {
      rrvaNumArrPti: '1'
    }
  },
  {
    group: TaxonomyGroup.city,
    code: 'PC',
    properties: {
      rrvaNumArrPti: '8'
    }
  },
  {
    group: TaxonomyGroup.city,
    code: 'DDO',
    properties: {
      rrvaNumArrPti: '11'
    }
  },
  {
    group: TaxonomyGroup.city,
    code: 'KLD',
    properties: {
      rrvaNumArrPti: '3'
    }
  },
  {
    group: TaxonomyGroup.city,
    code: 'BFD',
    properties: {
      rrvaNumArrPti: '7'
    }
  },
  {
    group: TaxonomyGroup.city,
    code: 'BDU',
    properties: {
      rrvaNumArrPti: '71'
    }
  },
  {
    group: TaxonomyGroup.city,
    code: 'SVL',
    properties: {
      rrvaNumArrPti: '77'
    }
  },
  {
    group: TaxonomyGroup.city,
    code: 'SADB',
    properties: {
      rrvaNumArrPti: '76'
    }
  }
];

export const taxos2753 = [...BOROUGH_CODE_AND_VALUE, ...CITY_CODE_AND_VALUE];

async function updateOne(codeAndValue: any, db: MongoDb.Db) {
  logger.info(`Updating ${codeAndValue.group} with code ${codeAndValue.code}`);
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await taxonomiesCollection.updateOne(
    { group: codeAndValue.group, code: codeAndValue.code },
    {
      $set: {
        [FIELD_PATH]: codeAndValue.properties.rrvaNumArrPti
      }
    }
  );
}

async function updateTaxonomies(db: MongoDb.Db): Promise<void> {
  logger.info('UPDATE TAXONOMIES STARTED');
  for (const codeAndValue of BOROUGH_CODE_AND_VALUE) {
    await updateOne(codeAndValue, db);
  }

  for (const codeAndValue of CITY_CODE_AND_VALUE) {
    await updateOne(codeAndValue, db);
  }
  logger.info('UPDATE TAXONOMIES DONE');
}
