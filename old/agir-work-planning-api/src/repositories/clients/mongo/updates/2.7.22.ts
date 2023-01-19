import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';
import { isEmpty } from '../../../../utils/utils';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.22');
let TAXONOMIES_COLLECTION: Collection;
/**
 * For V2.7.22 we need to add the taxonomy group infoRtuPartner.
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  const taxos = getExternalReferenceType();

  await upsertTaxonomies(taxos);
  await updateTaxonomies();

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.22 executed in ${milliseconds} milliseconds`);
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
function getExternalReferenceType(): ITaxonomy[] {
  return [
    {
      group: 'externalReferenceType',
      code: 'infoRtuId',
      label: {
        fr: 'ID - Info RTU',
        en: 'Info RTU ID'
      }
    }
  ];
}

const GROUP = 'projectStatus';
const FIELD_PATH = 'properties.rtuData';
const CODE_AND_VALUE = [
  {
    code: 'archived',
    value: {
      status: 'AC',
      phase: 'annualPlanning'
    }
  },
  {
    code: 'inDesign',
    value: {
      status: 'AC',
      phase: 'annualPlanning'
    }
  },
  {
    code: 'inRealization',
    value: {
      status: 'AC',
      phase: 'execution'
    }
  },
  {
    code: 'replanned',
    value: {
      status: 'AC',
      phase: 'annualPlanning'
    }
  },
  {
    code: 'finalOrdered',
    value: {
      status: 'AC',
      phase: 'annualPlanning'
    }
  },
  {
    code: 'preliminaryOrdered',
    value: {
      status: 'AC',
      phase: 'annualPlanning'
    }
  },
  {
    code: 'planned',
    value: {
      status: 'AC',
      phase: 'annualPlanning'
    }
  },
  {
    code: 'canceled',
    value: {
      status: 'AN',
      phase: 'annualPlanning'
    }
  },
  {
    code: 'postponed',
    value: {
      status: 'AC',
      phase: 'annualPlanning'
    }
  },
  {
    code: 'worked',
    value: {
      status: 'CO',
      phase: 'execution'
    }
  },
  {
    code: 'created',
    value: {
      status: 'AC',
      phase: 'annualPlanning'
    }
  },
  {
    code: 'programmed',
    value: {
      status: 'AC',
      phase: 'annualPlanning'
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
          status: item.value.status,
          phase: item.value.phase
        }
      }
    } as ITaxonomy;
  });
}
export const taxos2722: ITaxonomy[] = [...getExternalReferenceType(), ...getUpdateTaxonomies()];

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
