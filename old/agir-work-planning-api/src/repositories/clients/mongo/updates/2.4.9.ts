import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.4.9');

export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = new Date().getTime();
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await createOpportunityNoticeStatusTaxonomies(taxonomiesCollection);
  const milliseconds = new Date().getTime() - startTime;
  logger.info(`Script 2.4.9 executed in ${milliseconds} milliseconds`);
}

async function createOpportunityNoticeStatusTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  const opportunityNoticeStatusTaxonomies: ITaxonomy[] = [
    {
      group: 'opportunityNoticeStatus',
      code: 'new',
      label: {
        fr: 'Nouveau',
        en: 'New'
      }
    },
    {
      group: 'opportunityNoticeStatus',
      code: 'inProgress',
      label: {
        fr: 'En cours',
        en: 'In progress'
      }
    },
    {
      group: 'opportunityNoticeStatus',
      code: 'closed',
      label: {
        fr: 'Fermé',
        en: 'Closed'
      }
    }
  ];
  await taxonomiesCollection.insertMany(opportunityNoticeStatusTaxonomies);
}
