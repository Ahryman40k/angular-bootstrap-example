import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.21');
let taxonomiesCollection: MongoDb.Collection;

/**
 * For V2.7.21 we need to add the new group taxonomyGroup
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await insertTaxonomies(getTaxonomyGroupTaxonomies());

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.21 executed in ${milliseconds} milliseconds`);
}

async function insertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`Insert in taxonomies collection`);
  try {
    const insertResults = await taxonomiesCollection.insertMany(taxonomies);
    logger.info(`${insertResults.insertedCount} documents inserted in taxonomies collection`);
  } catch (e) {
    logger.info(`Insert taxonomies error -> ${e}`);
  }
}

// tslint:disable-next-line: max-func-body-length
function getTaxonomyGroupTaxonomies(): ITaxonomy[] {
  return [
    {
      code: 'assetDataKey',
      group: 'taxonomyGroup',
      label: {
        fr: "Attribut d'actifs",
        en: 'Asset attribute'
      },
      description: {
        fr: "Ce groupe définit les attributs d'actifs disponibles.",
        en: 'This group defines the available asset attributes.'
      },
      properties: {
        category: 'asset',
        permission: 'Write'
      }
    },
    {
      code: 'assetOwner',
      group: 'taxonomyGroup',
      label: {
        fr: "Propriétaire d'actifs",
        en: 'Asset owner'
      },
      description: {
        fr: "Ce groupe définit les propriétaires d'actifs disponibles.",
        en: 'This group defines the available asset owners.'
      },
      properties: {
        category: 'asset',
        permission: 'Write'
      }
    },
    {
      code: 'executor',
      group: 'taxonomyGroup',
      label: {
        fr: 'Exécutant',
        en: 'Executor'
      },
      description: {
        fr: 'Ce groupe définit les exécutants disponibles.',
        en: 'This group defines the available executors.'
      },
      properties: {
        category: 'annualProgram',
        permission: 'Write'
      }
    },
    {
      code: 'externalResource',
      group: 'taxonomyGroup',
      label: {
        fr: 'Ressource externe',
        en: 'External resource'
      },
      description: {
        fr: 'Ce groupe définit les ressources externes utiles.',
        en: 'This group defines the external resources.'
      },
      properties: {
        category: 'agir',
        permission: 'Write'
      }
    },
    {
      code: 'interventionDecisionRefused',
      group: 'taxonomyGroup',
      label: {
        fr: "Refus d'interventions",
        en: 'Intervention decision refused'
      },
      description: {
        fr: "Ce groupe définit les raisons expliquant le refus d'une intervention.",
        en: 'This group defines the reasons for refusing an intervention.'
      },
      properties: {
        category: 'intervention',
        permission: 'Write'
      }
    },
    {
      code: 'opportunityNoticeFollowUpMethod',
      group: 'taxonomyGroup',
      label: {
        fr: "Avis d'opportunité - Méthode de suivi",
        en: 'Opportunity notice follow up method'
      },
      description: {
        fr: "Ce groupe définit les méthodes de suivi disponibles pour un avis d'opportunité.",
        en: 'This group defines the follow up methods for an opportunity notice.'
      },
      properties: {
        category: 'project',
        permission: 'Write'
      }
    },
    {
      code: 'programType',
      group: 'taxonomyGroup',
      label: {
        fr: 'Type de programmes',
        en: 'Program type'
      },
      description: {
        fr: 'Ce groupe définit les programmes disponibles pour une intervention.',
        en: 'This group defines the available programs for an intervention.'
      },
      properties: {
        category: 'intervention',
        permission: 'Write'
      }
    },
    {
      code: 'requestor',
      group: 'taxonomyGroup',
      label: {
        fr: 'Requérant',
        en: 'Requestor'
      },
      description: {
        fr: 'Ce groupe définit les requérants disponibles.',
        en: 'This group defines the available requestors.'
      },
      properties: {
        category: 'project',
        permission: 'Write'
      }
    },
    {
      code: 'requirementRequestor',
      group: 'taxonomyGroup',
      label: {
        fr: 'Requérant pour une exigence',
        en: 'Requirement requestor'
      },
      description: {
        fr: 'Ce groupe définit les requérants disponibles pour une exigence.',
        en: 'This group defines the available requestors for a requirement.'
      },
      properties: {
        category: 'project',
        permission: 'Write'
      }
    },
    {
      code: 'requirementType',
      group: 'taxonomyGroup',
      label: {
        fr: "Type d'exigences",
        en: 'Requirement type'
      },
      description: {
        fr: "Ce groupe définit les types d'exigences.",
        en: 'This group defines the requirement types.'
      },
      properties: {
        category: 'project',
        permission: 'Write'
      }
    },
    {
      code: 'riskType',
      group: 'taxonomyGroup',
      label: {
        fr: 'Type de risques',
        en: 'Risk type'
      },
      description: {
        fr: 'Ce groupe définit les types de risques.',
        en: 'This group defines the risk types.'
      },
      properties: {
        category: 'project',
        permission: 'Write'
      }
    },
    {
      code: 'service',
      group: 'taxonomyGroup',
      label: {
        fr: 'Service',
        en: 'Service'
      },
      description: {
        fr: 'Ce groupe définit les services disponibles.',
        en: 'This group defines the available services.'
      },
      properties: {
        category: 'intervention',
        permission: 'Write'
      }
    },
    {
      code: 'workType',
      group: 'taxonomyGroup',
      label: {
        fr: 'Type de travaux',
        en: 'Work type'
      },
      description: {
        fr: 'Ce groupe définit les types de travaux disponibles.',
        en: 'This group defines the available work types.'
      },
      properties: {
        category: 'intervention',
        permission: 'Write'
      }
    },
    {
      code: 'commentCategory',
      group: 'taxonomyGroup',
      label: {
        fr: 'Catégorie de commentaires',
        en: 'Comment category'
      },
      description: {
        fr: 'Ce groupe définit les catégories de commentaire disponibles pour un projet et une intervention.',
        en: 'This group defines the comment categories for a project and an intervention.'
      },
      properties: {
        category: 'project',
        permission: 'Activation'
      }
    },
    {
      code: 'interventionDecisionType',
      group: 'taxonomyGroup',
      label: {
        fr: 'Type de décision - Intervention',
        en: 'Intervention decision type'
      },
      description: {
        fr: 'Ce groupe définit les types de décisions disponibles pour une intervention.',
        en: 'This group defines the decision types for an intervention.'
      },
      properties: {
        category: 'intervention',
        permission: 'Activation'
      }
    },
    {
      code: 'additionalCost',
      group: 'taxonomyGroup',
      label: {
        fr: 'Supplément',
        en: 'Additional cost'
      },
      description: {
        fr: 'Ce groupe définit les types de coûts additionnels pour un projet.',
        en: 'This group defines the additional cost types for a project.'
      },
      properties: {
        category: 'project',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'annualProgramStatus',
      group: 'taxonomyGroup',
      label: {
        fr: 'Statuts des programmations annuelles',
        en: 'Annual program status'
      },
      description: {
        fr: 'Ce groupe définit les statuts des programmations annuelles.',
        en: 'This group defines the annual program status.'
      },
      properties: {
        category: 'annualProgram',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'area',
      group: 'taxonomyGroup',
      label: {
        fr: 'Unité de surface',
        en: 'Area unit'
      },
      description: {
        fr: 'Ce groupe définit les unités de surface.',
        en: 'This group defines the area units.'
      },
      properties: {
        category: 'agir',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'assetType',
      group: 'taxonomyGroup',
      label: {
        fr: "Type d'actifs",
        en: 'Asset type'
      },
      description: {
        fr: "Ce groupe définit les types d'actifs.",
        en: 'This group defines the asset types.'
      },
      properties: {
        category: 'asset',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'borough',
      group: 'taxonomyGroup',
      label: {
        fr: 'Arrondissement',
        en: 'Borough'
      },
      description: {
        fr: 'Ce groupe définit les arrondissements.',
        en: 'This group defines the boroughs.'
      },
      properties: {
        category: 'agir',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'interventionStatus',
      group: 'taxonomyGroup',
      label: {
        fr: 'Statuts des interventions',
        en: 'Intervention status'
      },
      description: {
        fr: 'Ce groupe définit les statuts des interventions.',
        en: 'This group defines the intervention status.'
      },
      properties: {
        category: 'intervention',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'interventionType',
      group: 'taxonomyGroup',
      label: {
        fr: "Type d'interventions",
        en: 'Intervention type'
      },
      description: {
        fr: "Ce groupe définit les types d'interventions.",
        en: 'This group defines the intervention types.'
      },
      properties: {
        category: 'intervention',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'length',
      group: 'taxonomyGroup',
      label: {
        fr: 'Unité de longueur',
        en: 'Length unit'
      },
      description: {
        fr: 'Ce groupe définit les unités de longueur disponibles.',
        en: 'This group defines the available length units.'
      },
      properties: {
        category: 'agir',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'mapAssetLogicLayer',
      group: 'taxonomyGroup',
      label: {
        fr: 'Couche de données',
        en: 'Data layer'
      },
      description: {
        fr: 'Ce groupe définit les couches de données affichées sur la carte.',
        en: 'This group defines the data layers displayed on the map.'
      },
      properties: {
        category: 'agir',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'medalType',
      group: 'taxonomyGroup',
      label: {
        fr: 'Médaille',
        en: 'Medal'
      },
      description: {
        fr: 'Ce groupe définit les médailles disponibles pour les interventions et les projets.',
        en: 'This group defines the available medals for the interventions and projects.'
      },
      properties: {
        category: 'intervention',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'objectiveType',
      group: 'taxonomyGroup',
      label: {
        fr: "Type d'objectifs",
        en: 'Objective type'
      },
      description: {
        fr: "Ce groupe définit les types d'objectifs disponibles pour les carnets de programmation.",
        en: 'This group defines the objective types for a program book.'
      },
      properties: {
        category: 'programBook',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'objectiveUnits',
      group: 'taxonomyGroup',
      label: {
        fr: "Unité d'objectifs",
        en: 'Objective unit'
      },
      description: {
        fr: 'Ce groupe définit les unités de mesure disponibles pour les objectifs des carnets de programmation.',
        en: 'This group defines the objective units for a program book.'
      },
      properties: {
        category: 'programBook',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'opportunityNoticeRequestorDecision',
      group: 'taxonomyGroup',
      label: {
        fr: "Avis d'opportunité - Décision du requérant",
        en: 'Opportunity notice requestor decision'
      },
      description: {
        fr: "Ce groupe définit les décisions du requérant pour un avis d'opportunité.",
        en: 'This group defines the requestor decisions for an opportunity notice.'
      },
      properties: {
        category: 'project',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'opportunityNoticeStatus',
      group: 'taxonomyGroup',
      label: {
        fr: "Avis d'opportunité - Statuts des avis",
        en: 'Opportunity notice status'
      },
      description: {
        fr: "Ce groupe définit les statuts des avis d'opportunités.",
        en: 'This group defines the opportunity notice status.'
      },
      properties: {
        category: 'project',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'opportunityPlaningDecision',
      group: 'taxonomyGroup',
      label: {
        fr: "Avis d'opportunité - Décision du planificateur",
        en: 'Opportunity notice planning decision'
      },
      description: {
        fr: "Ce groupe définit les décisions du planificateur pour un avis d'opportunité.",
        en: 'This group defines the planning decisions for an opportunity notice.'
      },
      properties: {
        category: 'project',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'priorityType',
      group: 'taxonomyGroup',
      label: {
        fr: 'Priorité',
        en: 'Priority'
      },
      description: {
        fr: 'Ce groupe définit les priorités disponibles pour un projet.',
        en: 'This group defines the available priorities for a project.'
      },
      properties: {
        category: 'project',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'programBookStatus',
      group: 'taxonomyGroup',
      label: {
        fr: 'Statuts des carnets de programmation',
        en: 'Program book status'
      },
      description: {
        fr: 'Ce groupe définit les statuts des carnets de programmation.',
        en: 'This group defines the program book status.'
      },
      properties: {
        category: 'programBook',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'projectCategory',
      group: 'taxonomyGroup',
      label: {
        fr: 'Catégorie de projets',
        en: 'Project category'
      },
      description: {
        fr: 'Ce groupe définit les catégories de projet.',
        en: 'This group defines the project categories.'
      },
      properties: {
        category: 'project',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'projectDecisionType',
      group: 'taxonomyGroup',
      label: {
        fr: 'Type de décisions - Projet',
        en: 'Project decision type'
      },
      description: {
        fr: 'Ce groupe définit les types de décisions disponibles pour un projet.',
        en: 'This group defines the available decision types for a project.'
      },
      properties: {
        category: 'project',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'projectStatus',
      group: 'taxonomyGroup',
      label: {
        fr: 'Statuts des projets',
        en: 'Project status'
      },
      description: {
        fr: 'Ce groupe définit les statuts des projets.',
        en: 'This group defines the project status.'
      },
      properties: {
        category: 'project',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'projectSubCategory',
      group: 'taxonomyGroup',
      label: {
        fr: 'Sous-catégorie de projets',
        en: 'Project subcategory'
      },
      description: {
        fr: 'Ce groupe définit les sous-catégories de projets.',
        en: 'This group defines the project subcategories.'
      },
      properties: {
        category: 'project',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'projectType',
      group: 'taxonomyGroup',
      label: {
        fr: 'Type de projets',
        en: 'Project type'
      },
      description: {
        fr: 'Ce groupe définit les types de projets.',
        en: 'This group defines the project types.'
      },
      properties: {
        category: 'project',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'roadNetworkType',
      group: 'taxonomyGroup',
      label: {
        fr: 'Type de routes',
        en: 'Road Network type'
      },
      description: {
        fr: 'Ce groupe définit les types de routes.',
        en: 'This group defines the road network types.'
      },
      properties: {
        category: 'agir',
        permission: 'ModificationOnly'
      }
    }
  ];
}

export const taxos2721 = getTaxonomyGroupTaxonomies();
