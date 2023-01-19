import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.4.8');

export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = new Date().getTime();
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await createOpportunityNoticeFollowUpMethodTaxonomies(taxonomiesCollection);
  await createOpportunityNoticeRequestorDecisionTaxonomies(taxonomiesCollection);
  await createOpportunityNoticePlaningDecisionTaxonomies(taxonomiesCollection);
  const milliseconds = new Date().getTime() - startTime;
  logger.info(`Script 2.4.8 executed in ${milliseconds} milliseconds`);
}

const opportunityNoticeFollowUpMethodTaxonomies: ITaxonomy[] = [
  {
    group: 'opportunityNoticeFollowUpMethod',
    code: 'email',
    displayOrder: 1,
    label: {
      en: 'Email',
      fr: 'Courriel'
    }
  }
];
const opportunityNoticePlaningDecisionTaxonomies: ITaxonomy[] = [
  {
    group: 'opportunityPlaningDecision',
    code: 'accepted',
    displayOrder: 1,
    label: {
      en: 'Integration accepted',
      fr: 'Intégration acceptée'
    }
  },
  {
    group: 'opportunityPlaningDecision',
    code: 'rejected',
    displayOrder: 2,
    label: {
      en: 'Integration rejected',
      fr: 'Intégration non acceptée'
    }
  },
  {
    group: 'opportunityPlaningDecision',
    code: 'pending',
    displayOrder: 3,
    label: {
      en: 'Pending',
      fr: `En attente de décision`
    }
  }
];

async function createOpportunityNoticeFollowUpMethodTaxonomies(
  taxonomiesCollection: MongoDb.Collection
): Promise<void> {
  await taxonomiesCollection.insertMany(opportunityNoticeFollowUpMethodTaxonomies);
}

async function createOpportunityNoticeRequestorDecisionTaxonomies(
  taxonomiesCollection: MongoDb.Collection
): Promise<void> {
  const opportunityNoticeRequestorDecisionTaxonomies: ITaxonomy[] = [
    {
      group: 'opportunityNoticeRequestorDecision',
      code: 'yes',
      displayOrder: 1,
      label: {
        en: 'Yes',
        fr: 'Oui'
      }
    },
    {
      group: 'opportunityNoticeRequestorDecision',
      code: 'no',
      displayOrder: 2,
      label: {
        en: 'No',
        fr: 'Non'
      }
    },
    {
      group: 'opportunityNoticeRequestorDecision',
      code: 'analyzing',
      displayOrder: 3,
      label: {
        en: 'Analyzing',
        fr: `En cours d'analyse`
      }
    }
  ];
  await taxonomiesCollection.insertMany(opportunityNoticeRequestorDecisionTaxonomies);
}

async function createOpportunityNoticePlaningDecisionTaxonomies(
  taxonomiesCollection: MongoDb.Collection
): Promise<void> {
  await taxonomiesCollection.insertMany(opportunityNoticePlaningDecisionTaxonomies);
}

export const taxos248 = [...opportunityNoticeFollowUpMethodTaxonomies, ...opportunityNoticePlaningDecisionTaxonomies];
