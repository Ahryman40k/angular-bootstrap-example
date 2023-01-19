import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.8.18`;
const logger = createLogger(`mongo/${VERSION}`);

let taxonomiesCollection: MongoDb.Collection<any> = null;
/**
 * need to add a taxonomies for the comment type risk.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await insertDocumentTaxonomy();
  const seconds = Date.now() - startTime;
  logger.info(`Document taxonomies updated in ${seconds} seconds`);
}

// tslint:disable-next-line: max-func-body-length
async function insertDocumentTaxonomy() {
  const taxonomies: ITaxonomy[] = [
    {
      code: 'submissionRequirementMention',
      group: 'taxonomyGroup',
      label: {
        fr: "Mention d'exigences de conception",
        en: 'Design requirement statement'
      },
      description: {
        fr: "Ce groupe définit les mentions d'exigences de conception.",
        en: 'This group defines the design requirement statements.'
      },
      properties: {
        category: 'programBook',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'submissionRequirementType',
      group: 'taxonomyGroup',
      label: {
        fr: "Type d'exigences de conception",
        en: 'Design requirement type'
      },
      description: {
        fr: "Ce groupe définit les types d'exigences de conception.",
        en: 'This group defines the design requirement types.'
      },
      properties: {
        category: 'programBook',
        permission: 'Write'
      }
    },
    {
      code: 'submissionRequirementSubtype',
      group: 'taxonomyGroup',
      label: {
        fr: "Sous-type d'exigences de conception",
        en: 'Design requirement subtype'
      },
      description: {
        fr: "Ce groupe définit les sous-types d'exigences de conception.",
        en: 'This group defines the design requirement subtypes.'
      },
      properties: {
        category: 'programBook',
        permission: 'Write'
      }
    }
  ];

  for (const taxonomy of taxonomies) {
    if (!(await taxonomiesCollection.findOne({ group: taxonomy.group, code: taxonomy.code }))) {
      await taxonomiesCollection.insertOne(taxonomy);
    }
  }
}
