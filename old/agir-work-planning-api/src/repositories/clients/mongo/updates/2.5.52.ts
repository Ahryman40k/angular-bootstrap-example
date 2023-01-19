import { ILocalizedText, ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.5.52');

export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await deleteExternalResourceTaxonomies(taxonomiesCollection);
  await createExternalResourceTaxonomies(taxonomiesCollection);
  await upsertProgramTypeTaxonomies(taxonomiesCollection);
}

interface IProperties {
  url?: string;
  acronym?: ILocalizedText;
}

interface ITaxonomyForScript extends ITaxonomy {
  properties?: IProperties;
}

async function upsertOne(
  collection: MongoDb.Collection,
  filter: MongoDb.FilterQuery<any>,
  upsert: MongoDb.UpdateQuery<any> | Partial<any>
): Promise<void> {
  const updateResult = await collection.updateOne(filter, upsert, { upsert: true });
  logger.info(`Updated ${updateResult.upsertedCount} documents in collection ${collection.collectionName}`);
}

async function deleteExternalResourceTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  const result = await taxonomiesCollection.deleteMany({ group: 'externalResource' });
  logger.info(`${result.deletedCount} group externalResource DELETED`);
}

// tslint:disable-next-line:max-func-body-length
async function createExternalResourceTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`create taxonomy in group externalResource`);

  const externalResourceTaxonomies: ITaxonomyForScript[] = [
    {
      group: 'externalResource',
      code: 'micrositeAgir',
      label: {
        fr: 'Microsite AGIR',
        en: 'Microsite AGIR'
      },
      properties: {
        url: 'https://sites.google.com/sia-partners.com/siteinternetprojetagir/accueil'
      }
    },
    {
      group: 'externalResource',
      code: 'faq',
      label: {
        fr: 'Foire aux questions',
        en: 'Frequently Asked Questions'
      },
      properties: {
        url:
          'https://sites.google.com/sia-partners.com/siteinternetprojetagir/le-volet-planification/foire-aux-questions'
      }
    }
  ];
  const insertResults = await taxonomiesCollection.insertMany(externalResourceTaxonomies);
  logger.info(`${insertResults.insertedCount} documents inserted in taxonomy group externalResource`);
}

// tslint:disable-next-line:max-func-body-length
async function upsertProgramTypeTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Upsert taxonomy in group programType`);

  const mapProgramTypeTaxonomies: ITaxonomyForScript[] = [
    {
      group: 'programType',
      code: 'sae',
      label: {
        fr: 'Réhabilitation d’aqueduc secondaire',
        en: 'secondary aqueduct rehabilitation'
      },
      properties: {
        acronym: {
          fr: 'RÉHAB AQ SEC',
          en: 'RÉHAB AQ SEC'
        }
      }
    },
    {
      group: 'programType',
      code: 'ssr',
      label: {
        fr: 'Réhabilitation d’égout secondaire',
        en: 'secondary sewer rehabilitation'
      },
      properties: {
        acronym: {
          fr: 'RÉHAB EG SEC',
          en: 'RÉHAB EG SEC'
        }
      }
    },
    {
      group: 'programType',
      code: 'psr',
      label: {
        fr: 'Réhabilitation d’égout principal',
        en: 'primary sewer rehabilitation'
      },
      properties: {
        acronym: {
          fr: 'RÉHAB EG PRINC',
          en: 'RÉHAB EG PRINC'
        }
      }
    },
    {
      group: 'programType',
      code: 'par',
      label: {
        fr: 'Réhabilitation d’aqueduc principal',
        en: 'primary aqueduct rehabilitation'
      },
      properties: {
        acronym: {
          fr: 'RÉHAB AQ PRINC',
          en: 'RÉHAB AQ PRINC'
        }
      }
    },
    {
      group: 'programType',
      code: 'prcpr',
      label: {
        fr: 'Programme de réhabilitation de chaussées par planage-revêtement',
        en: 'rehabiliation resurfacing program'
      },
      properties: {
        acronym: {
          fr: 'PRCPR',
          en: 'PRCPR'
        }
      }
    },
    {
      group: 'programType',
      code: 'pcpr',
      label: {
        fr: 'Programme complémentaire de planage-revêtement',
        en: 'complementary resurfacing program'
      },
      properties: {
        acronym: {
          fr: 'PCPR',
          en: 'PCPR'
        }
      }
    },
    {
      group: 'programType',
      code: 'aqueductLead',
      label: {
        fr: 'Remplacement des entrées de services en plomb',
        en: 'Replacing lead service entrance'
      },
      properties: {
        acronym: {
          fr: 'ESP',
          en: 'ESP'
        }
      }
    }
  ];

  for (const taxonomy of mapProgramTypeTaxonomies) {
    try {
      await upsertOne(
        taxonomiesCollection,
        { group: taxonomy.group, code: taxonomy.code },
        {
          $set: {
            'label.fr': taxonomy.label.fr,
            'label.en': taxonomy.label.en,
            'properties.acronym.fr': taxonomy.properties.acronym.fr,
            'properties.acronym.en': taxonomy.properties.acronym.en
          }
        }
      );
    } catch (e) {
      logger.info(`Upsert taxonomy in group programType error -> ${e}`);
    }
  }
}
