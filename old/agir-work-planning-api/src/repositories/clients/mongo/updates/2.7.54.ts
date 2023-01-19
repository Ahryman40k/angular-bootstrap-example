import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.54');

/**
 * Updates app schema to version 2.7.54
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  // ==========================================
  // Create indexes
  // @see https://docs.mongodb.com/manual/reference/command/createIndexes/
  // ==========================================
  try {
    logger.info(`Start creating indexes collections`);
    const startTime = Date.now();
    await createAnnualProgramIndexes(db);
    await createHistoryIndexes(db);
    await createImportRelationsIndexes(db);
    await createInterventionsIndexes(db);
    await createOpportunityNoticesIndexes(db);
    await createProgramBooksIndexes(db);
    await createProjectsIndexes(db);
    await createUsersPreferencesIndexes(db);
    await createTaxonomiesIndexes(db);
    await createNexoImportLogsIndexes(db);
    await createRtuImportLogsIndexes(db);
    await createRtuProjectsIndexes(db);
    await createRtuExportLogsIndexes(db);
    logger.info(`End creating indexes collections`);
    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.54 executed in ${milliseconds} milliseconds`);
  } catch (error) {
    logger.error('Error creating indexes collections', `${error}`);
  }
}

async function createAnnualProgramIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.ANNUAL_PROGRAMS}" collection.`);
  const annualProgramCollection: MongoDb.Collection = db.collection(constants.mongo.collectionNames.ANNUAL_PROGRAMS);
  // ==========================================
  // Creating indexes for the "AnnualProgram" collection.
  // ==========================================
  await annualProgramCollection.createIndexes([
    {
      key: {
        year: 1,
        executorId: 1
      },
      name: 'year_1_executorId_1'
    }
  ]);
}

async function createHistoryIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.HISTORY}" collection.`);
  const history: MongoDb.Collection = db.collection(constants.mongo.collectionNames.HISTORY);
  // ==========================================
  // Creating indexes for the "History" collection.
  // ==========================================
  await history.createIndexes([
    {
      key: {
        objectTypeId: 1,
        referenceId: 1,
        'summary.statusFrom': 1,
        'summary.statusTo': 1
      },
      name: 'objTypeId_1_refId_1_status_1'
    }
  ]);
}

async function createImportRelationsIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.IMPORT_RELATIONS}" collection.`);
  const importRelations: MongoDb.Collection = db.collection(constants.mongo.collectionNames.IMPORT_RELATIONS);
  // ==========================================
  // Creating indexes for the "importRelations" collection.
  // ==========================================
  await importRelations.createIndexes([
    {
      key: {
        bicProjectNumber: 1
      },
      name: 'bicProjectNumber_1'
    },
    {
      key: {
        bicProjectId: 1
      },
      name: 'bicProjectId_1'
    },
    {
      key: {
        projectId: 1
      },
      name: 'projectId_1'
    }
  ]);
}

async function createInterventionsIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.INTERVENTIONS}" collection.`);
  const interventions: MongoDb.Collection = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  // ==========================================
  // Creating indexes for the "interventions" collection.
  // ==========================================
  await interventions.createIndexes([
    {
      key: {
        status: 1
      },
      name: 'status_1'
    },
    {
      key: {
        interventionTypeId_1: 1
      },
      name: 'interventionTypeId'
    },
    {
      key: {
        workTypeId_1: 1
      },
      name: 'workTypeId'
    },
    {
      key: {
        requestorId: 1
      },
      name: 'requestorId_1'
    },
    {
      key: {
        boroughId_1: 1
      },
      name: 'boroughId'
    },
    {
      key: {
        executorId: 1
      },
      name: 'executorId_1'
    },
    {
      key: {
        medalId: 1
      },
      name: 'medalId_1'
    },
    {
      key: {
        'interventionArea.geometryPin': '2dsphere'
      },
      name: 'interventionArea_geometryPin_1'
    },
    {
      key: {
        planificationYear: 1
      },
      name: 'planificationYear_1'
    },
    {
      key: {
        programId: 1
      },
      name: 'programId_1'
    },
    {
      key: {
        'project.id': 1
      },
      name: 'project_id_1'
    },
    {
      key: {
        'assets.id': 1
      },
      name: 'assets_id_1'
    },
    {
      key: {
        'interventionArea.geometry': '2dsphere'
      },
      name: 'interventionArea_geometry_1'
    }
  ]);
}

async function createOpportunityNoticesIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.OPPORTUNITY_NOTICES}" collection.`);
  const opportunityNoticeCollection: MongoDb.Collection = db.collection(
    constants.mongo.collectionNames.OPPORTUNITY_NOTICES
  );
  // ==========================================
  // Creating indexes for the "opportunityNotice" collection.
  // ==========================================
  await opportunityNoticeCollection.createIndexes([
    {
      key: {
        projectId: 1
      },
      name: 'projectId_1'
    }
  ]);
}

async function createProgramBooksIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.PROGRAM_BOOKS}" collection.`);
  const programBooks: MongoDb.Collection = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  // ==========================================
  // Creating indexes for the "programBooks" collection.
  // ==========================================
  await programBooks.createIndexes([
    {
      key: {
        annualProgramId: 1
      },
      name: 'annualProgramId_1'
    },
    {
      key: {
        projectTypes: 1
      },
      name: 'projectTypes_1'
    },
    {
      key: {
        status: 1
      },
      name: 'status_1'
    },
    {
      key: {
        boroughIds: 1
      },
      name: 'boroughIds_1'
    },
    {
      key: {
        sharedRoles: 1
      },
      name: 'sharedRoles_1'
    }
  ]);
}

async function createProjectsIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.PROJECTS}" collection.`);
  const projects: MongoDb.Collection = db.collection(constants.mongo.collectionNames.PROJECTS);
  // ==========================================
  // Creating indexes for the "projects" collection.
  // ==========================================
  await projects.createIndexes([
    {
      key: {
        'annualDistribution.annualPeriods.programBookId': 1
      },
      name: 'programBookId_1'
    },
    {
      key: {
        status: 1
      },
      name: 'status_1'
    },
    {
      key: {
        projectTypeId: 1
      },
      name: 'projectTypeId_1'
    },
    {
      key: {
        boroughId: 1
      },
      name: 'boroughId_1'
    },
    {
      key: {
        executorId: 1
      },
      name: 'executorId_1'
    },
    {
      key: {
        geometryPin: '2dsphere'
      },
      name: 'geometryPin_1'
    },
    {
      key: {
        geometry: '2dsphere'
      },
      name: 'geometry_1'
    },
    {
      key: {
        medalId: 1
      },
      name: 'medalId_1'
    },
    {
      key: {
        startYear: 1
      },
      name: 'startYear_1'
    },
    {
      key: {
        endYear: 1
      },
      name: 'endYear_1'
    },
    {
      key: {
        subCategoryIds: 1
      },
      name: 'subCategoryIds_1'
    },
    {
      key: {
        drmNumber: 1
      },
      name: 'drmNumber_1'
    }
  ]);
}

async function createUsersPreferencesIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.USERS_PREFERENCES}" collection.`);
  const usersPreferences: MongoDb.Collection = db.collection(constants.mongo.collectionNames.USERS_PREFERENCES);
  // ==========================================
  // Creating indexes for the "usersPreferences" collection.
  // ==========================================
  await usersPreferences.createIndexes([
    {
      key: {
        userId: 1
      },
      name: 'userId_1'
    },
    {
      key: {
        key: 1
      },
      name: 'key_1'
    }
  ]);
}

async function createTaxonomiesIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.TAXONOMIES}" collection.`);
  const taxonomies: MongoDb.Collection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  // ==========================================
  // Creating indexes for the "taxonomies" collection.
  // ==========================================
  await taxonomies.createIndexes([
    {
      key: {
        group: 1
      },
      name: 'group_1'
    }
  ]);
}

async function createNexoImportLogsIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.NEXO_IMPORT_LOGS}" collection.`);
  const nexoImportLogs: MongoDb.Collection = db.collection(constants.mongo.collectionNames.NEXO_IMPORT_LOGS);
  // ==========================================
  // Creating indexes for the "nexoImportLogs" collection.
  // ==========================================
  await nexoImportLogs.createIndexes([
    {
      key: {
        'audit.createdAt': 1
      },
      name: 'audit_createdAt_1'
    }
  ]);
}

async function createRtuImportLogsIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.RTU_IMPORT_LOGS}" collection.`);
  const rtuImportLogs: MongoDb.Collection = db.collection(constants.mongo.collectionNames.RTU_IMPORT_LOGS);
  // ==========================================
  // Creating indexes for the "rtuImportLogs" collection.
  // ==========================================
  await rtuImportLogs.createIndexes([
    {
      key: {
        startDateTime: 1
      },
      name: 'startDateTime_1'
    },
    {
      key: {
        endDateTime: 1
      },
      name: 'endDateTime_1'
    },
    {
      key: {
        status: 1
      },
      name: 'status_1'
    }
  ]);
}

async function createRtuProjectsIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.RTU_PROJECTS}" collection.`);
  const rtuProjects: MongoDb.Collection = db.collection(constants.mongo.collectionNames.RTU_PROJECTS);
  // ==========================================
  // Creating indexes for the "rtuImportLogs" collection.
  // ==========================================
  await rtuProjects.createIndexes([
    {
      key: {
        areaId: 1
      },
      name: 'areaId_1'
    },
    {
      key: {
        partnerId: 1
      },
      name: 'partnerId_1'
    },
    {
      key: {
        dateStart: 1
      },
      name: 'dateStart_1'
    },
    {
      key: {
        dateEnd: 1
      },
      name: 'dateEnd_1'
    },
    {
      key: {
        geometryPin: '2dsphere'
      },
      name: 'geometryPin_1'
    }
  ]);
}
async function createRtuExportLogsIndexes(db: MongoDb.Db): Promise<void> {
  logger.info(` > Creating index "${constants.mongo.collectionNames.RTU_EXPORT_LOGS}" collection.`);
  const rtuExportLogs: MongoDb.Collection = db.collection(constants.mongo.collectionNames.RTU_EXPORT_LOGS);
  // ==========================================
  // Creating indexes for the "rtuExportLogs" collection.
  // ==========================================
  await rtuExportLogs.createIndexes([
    {
      key: {
        startDateTime: 1
      },
      name: 'startDateTime_1'
    },
    {
      key: {
        endDateTime: 1
      },
      name: 'endDateTime_1'
    },
    {
      key: {
        status: 1
      },
      name: 'status_1'
    }
  ]);
}
