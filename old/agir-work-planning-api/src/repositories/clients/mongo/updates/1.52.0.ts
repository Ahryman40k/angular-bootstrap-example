import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.52.0');

export default async function update(db: MongoDb.Db): Promise<void> {
  let err = '';
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  try {
    await deleteRequestorTaxonomies(taxonomiesCollection);
    await insertRequestorTaxonomies(taxonomiesCollection);
  } catch (e) {
    err = `${err}\nError -> ${e}`;
  }

  if (err) {
    logger.info(`${err}`);
  }
}

async function deleteRequestorTaxonomies(taxonomiesCollection: MongoDb.Collection) {
  await taxonomiesCollection.deleteMany({ group: 'requestor' });
  logger.info(`Deleting requestor taxonomies`);
}

// tslint:disable-next-line:max-func-body-length
async function insertRequestorTaxonomies(taxonomiesCollection: MongoDb.Collection) {
  const taxonomies: ITaxonomy[] = [
    {
      group: 'requestor',
      code: 'publicWorksPT',
      label: {
        fr: 'DGAC (ponts-tunnels)',
        en: 'DGAC (ponts-tunnels)'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'deeu',
      label: {
        fr: 'DEEU',
        en: 'DEEU'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'signals',
      label: {
        fr: 'ERA (Feux)',
        en: 'Signals'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'borough',
      label: {
        fr: 'Arrondissement',
        en: 'borough'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'dep',
      label: {
        fr: 'DEP',
        en: 'DEP'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'stm',
      label: {
        fr: 'STM',
        en: 'STM'
      },
      properties: {
        isInternal: false
      }
    },
    {
      group: 'requestor',
      code: 'dtac',
      label: {
        fr: 'Section Vélo',
        en: 'Section Vélo'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'energir',
      label: {
        fr: 'Energir',
        en: 'energir'
      },
      properties: {
        isInternal: false
      }
    },
    {
      group: 'requestor',
      code: 'waterManagement',
      label: {
        fr: "Réseau d'eau",
        en: 'water management'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'csem',
      label: {
        fr: 'CSEM',
        en: 'CSEM'
      },
      properties: {
        isInternal: false
      }
    },
    {
      group: 'requestor',
      code: 'sca',
      label: {
        fr: 'Service de la concertation des arrondissements',
        en: 'Service de la concertation des arrondissments'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'spjcci',
      label: {
        fr: 'SPJCCI',
        en: 'SPJCCI'
      },
      properties: {
        isInternal: false
      }
    },
    {
      group: 'requestor',
      code: 'dagp',
      label: {
        fr: 'Aménagement de Rues',
        en: 'Aménagement de Rues'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'bell',
      label: {
        fr: 'Bell Canada',
        en: 'Bell Canada'
      },
      properties: {
        isInternal: false
      }
    },
    {
      group: 'requestor',
      code: 'hq',
      label: {
        fr: 'Hydro-Québec',
        en: 'hq'
      },
      properties: {
        isInternal: false
      }
    },
    {
      group: 'requestor',
      code: 'sgpi',
      label: {
        fr: 'SGPI - Immobilier',
        en: 'SGPI - Immobilier'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'publicWorksRoad',
      label: {
        fr: 'DGAC (Voirie et Cyclable)',
        en: 'DGAC (Voirie et Cyclable)'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'dre',
      label: {
        fr: 'DRE',
        en: 'DRE'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'sgp',
      label: {
        fr: 'Service Grands Parcs',
        en: 'Service Grands Parcs'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'mtq',
      label: {
        fr: 'MTQ',
        en: 'MTQ'
      },
      properties: {
        isInternal: false
      }
    },
    {
      group: 'requestor',
      code: 'gpdu',
      label: {
        fr: 'GP-DU',
        en: 'GP-DU'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'gpdm',
      label: {
        fr: 'GP-DM',
        en: 'GP-DM'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'gppart',
      label: {
        fr: 'GP-SIRR-Partenaires',
        en: 'GP-SIRR-Partenaires'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'gpville',
      label: {
        fr: 'GP-SIRR-Ville',
        en: 'GP-SIRR-Ville'
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'senv',
      label: {
        fr: "Service de l'environnement",
        en: "Service de l'environnement"
      },
      properties: {
        isInternal: true
      }
    },
    {
      group: 'requestor',
      code: 'ican',
      label: {
        fr: 'Infrastructure Canada',
        en: 'Infrastructure Canada'
      },
      properties: {
        isInternal: false
      }
    }
  ];

  await taxonomiesCollection.insertMany(taxonomies);
  logger.info(`Inserting requestor taxonomies`);
}
