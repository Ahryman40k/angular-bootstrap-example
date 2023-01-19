import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.24');
let TAXONOMIES_COLLECTION: Collection;
/**
 * For V2.7.24 we need to update the taxonomy group programType.
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await updateTaxonomies();
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.24 executed in ${milliseconds} milliseconds`);
}

const GROUP = 'programType';
const FIELD_PATH = 'properties.rtuData';
const CODE_AND_VALUE = [
  {
    code: 'busStop',
    value: {
      value: 'Grand Projet',
      definition: 'Grand Projet'
    }
  },
  {
    code: 'chargingPoint',
    value: {
      value: 'Installation bornes/panneaux',
      definition: 'Installation bornes/panneaux'
    }
  },
  {
    code: 'aqueductChamberPrgm',
    value: {
      value: 'SE Chambre',
      definition: 'SE Chambre'
    }
  },
  {
    code: 'bikePathMntn',
    value: {
      value: 'Piste cyclable',
      definition: 'Piste cyclable'
    }
  },
  {
    code: 'trafficLightsMgmt',
    value: {
      value: 'Mise aux normes des feux',
      definition: 'Mise aux normes des feux'
    }
  },
  {
    code: 'pcpr',
    value: {
      value: 'PCPR',
      definition: 'PCPR'
    }
  },
  {
    code: 'prcpr',
    value: {
      value: 'PRCPR',
      definition: 'PRCPR'
    }
  },
  {
    code: 'aqueductLead',
    value: {
      value: 'SE Conduite',
      definition: 'SE Conduite'
    }
  },
  {
    code: 'par',
    value: {
      value: 'Réhabilitation AQ',
      definition: 'Réhabilitation AQ'
    }
  },
  {
    code: 'sae',
    value: {
      value: 'Réhabilitation AQ',
      definition: 'Réhabilitation AQ'
    }
  },
  {
    code: 'psr',
    value: {
      value: 'Réhabilitation EG',
      definition: 'Réhabilitation EG'
    }
  },
  {
    code: 'ssr',
    value: {
      value: 'Réhabilitation EG',
      definition: 'Réhabilitation EG'
    }
  }
];

function getUpdateTaxonomies(): ITaxonomy[] {
  return CODE_AND_VALUE.map(item => {
    return {
      code: item.code,
      group: GROUP,
      properties: {
        rtuData: {
          value: item.value.value,
          definition: item.value.definition
        }
      }
    } as ITaxonomy;
  });
}
export const taxos2724: ITaxonomy[] = [...getUpdateTaxonomies()];

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
