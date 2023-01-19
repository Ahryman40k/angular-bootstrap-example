import {
  IEnrichedAnnualProgram,
  IEnrichedIntervention,
  IEnrichedProgramBook,
  IEnrichedProject,
  INexoImportLog,
  IRequirement,
  ISubmission,
  NexoFileType,
  NexoImportStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { readdirSync } from 'fs-extra';
import * as path from 'path';
import sinon = require('sinon');

import { userMocks } from '../../../../../tests/data/userMocks';
import { spatialAnalysisServiceStub } from '../../../../../tests/utils/stub/spatialAnalysisService.stub';
import { storageApiServiceStub } from '../../../../../tests/utils/stub/storageApiService.stub';
import { destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { spatialAnalysisService } from '../../../../services/spatialAnalysisService';
import {
  assertAnnualPrograms,
  assertInterventions,
  assertProjects,
  assertRequirements,
  assertResults,
  readFile,
  setTestApp
} from '../../../../shared/largeTest/largeTestHelper';
import { Result } from '../../../../shared/logic/result';
import { appUtils, isEmpty } from '../../../../utils/utils';
import { getFeature } from '../../../asset/tests/assetTestHelper';
import { counterRepository } from '../../../counters/mongo/counterRepository';
import { InterventionFindOptions } from '../../../interventions/models/interventionFindOptions';
import { interventionRepository } from '../../../interventions/mongo/interventionRepository';
import { ProjectFindOptions } from '../../../projects/models/projectFindOptions';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { taxonomyService } from '../../../taxonomies/taxonomyService';
import { NexoImportLog } from '../../models/nexoImportLog';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import { startNexoImportUseCase } from '../../useCases/startNexoImport/startNexoImportUseCase';
import {
  deleteNexoBookTaxonomy,
  getNexoImportFile,
  getNexoImportLog,
  insertNexoBookTaxonomy,
  INTERVENTIONS_BUDGET_SE_FILE_STORAGE_ID,
  INTERVENTIONS_SE_FILE_STORAGE_ID,
  NEXO_DELAY,
  REHAB_AQ_CONCEPTION_FILE_STORAGE_ID,
  REHAB_EG_CONCEPTION_FILE_STORAGE_ID
} from '../nexoTestHelper';
import {
  assertProgramBooks,
  assertSubmissions,
  doInterventionActions,
  doProjectActions,
  getNexoImportLogFromDB,
  ILargeTestScenario,
  InterventionAction,
  ProjectAction,
  stubDownload
} from './nexoImportLargeTestHelper';

const sandbox = sinon.createSandbox();

/* tslint:disable: variable-name */
const insertOneInterventionPni_1 = '1-insertOneInterventionPni';
const insertSeveralInterventionsWithSamePi_3 = '3-insertSeveralInterventionsWithSamePi';
const insertOneInterventionPi_4 = '4-insertOneInterventionPi';
const insertOneInterventionDi_6 = '6-insertOneInterventionDi';
const budgetDataOneInterventionDi_52 = '52-budgetDataOneInterventionDi';
/* tslint:enable: variable-name */

const testScenarios: ILargeTestScenario[] = [
  {
    folders: [insertOneInterventionPni_1]
  },
  {
    folders: ['2-insertSeveralLinkedInterventionsPni']
  },
  {
    folders: [insertSeveralInterventionsWithSamePi_3]
  },
  {
    folders: [insertOneInterventionPi_4]
  },
  {
    folders: ['5-insertSeveralUnlinkedInterventionsPni']
  },
  {
    folders: [insertOneInterventionDi_6]
  },
  {
    folders: ['7-insertOneInterventionPniWithoutAsset']
  },
  {
    folders: ['8-cancelUnknownIntervention']
  },
  {
    folders: ['9-insertSeveralUnlinkedInterventionsPi']
  },
  {
    folders: [insertOneInterventionPni_1, '10-updateOneInterventionPni']
  },
  {
    folders: ['2-insertSeveralLinkedInterventionsPni', '11-cancelLinkedInterventions']
  },
  {
    folders: [insertOneInterventionPi_4, '12-updateOneInterventionPi']
  },
  {
    folders: ['13-insertOneWishedInterventionPi']
  },
  {
    folders: [insertOneInterventionDi_6, '14-addOneAssetToInterventionDi']
  },
  {
    folders: [insertOneInterventionPni_1, '15-updateOneInterventionPniToPi']
  },
  {
    folders: [insertOneInterventionDi_6, '16-updateOneInterventionDiToNotDi']
  },
  {
    folders: [insertOneInterventionDi_6, '17-cancelOneInterventionDi']
  },
  {
    folders: [insertSeveralInterventionsWithSamePi_3, '18-cancelOneInterventionLinkedToOthersPi']
  },
  {
    folders: [insertSeveralInterventionsWithSamePi_3, '19-cancelAllInterventions']
  },
  {
    folders: [insertOneInterventionPi_4, '20-addOneInterventionPiToExistingProject']
  },
  {
    folders: ['21-insertInterventionsPniAndPi', '22-updateInterventionPniToPi']
  },
  {
    folders: ['23-insertLinkedInterventionsPi', '24-cancelOneIntervention']
  },
  {
    folders: [insertOneInterventionPi_4, '25-addOneInterventionAndCancelOne']
  },
  {
    folders: ['26-addTwoInterventionsPiDreAndDi', '27-updateInterventionDiToDre']
  },
  {
    folders: [insertSeveralInterventionsWithSamePi_3, '28-cancelOneInterventionAlone']
  },
  {
    folders: [insertOneInterventionDi_6, '29-updateOneInterventionDi']
  },
  {
    folders: ['30-budgetDataEmpty'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['31-budgetDataWrongHeader'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['32-budgetDataHeaderOnly'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['33-budgetDataNegativeYear'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['34-budgetDataNegativeValue'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['35-budgetDataNegativeValueBis'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['36-wrongHeader'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['37-wrongGeometry'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['38-onlyHeader'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['39-emptyFile'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['40-mappingIssue'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['41-invalidIntervention'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: [insertOneInterventionPni_1, '42-importDateIssue'],
    expectedResults: [NexoImportStatus.SUCCESS, NexoImportStatus.FAILURE]
  },
  {
    folders: ['23-insertLinkedInterventionsPi', '43-replaceOneAsset']
  },
  {
    folders: ['44-OnlyMandatoriesData']
  },
  {
    folders: ['45-budgetDataUnknownIntervention'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['46-budgetDataError'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['47-budgetDataDuplicateError'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['48-budgetDataBudgetError'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['49-budgetDataWrongYear'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['50-budgetDataOneInterventionPni']
  },
  {
    folders: ['51-budgetDataOneIntervention']
  },
  {
    folders: [budgetDataOneInterventionDi_52]
  },
  {
    folders: ['53-budgetDataOneInterventionDre']
  },
  {
    folders: [budgetDataOneInterventionDi_52, '54-budgetDataUpdateOneInterventionDi']
  },
  {
    folders: ['53-budgetDataOneInterventionDre', '55-budgetDataUpdateOneInterventionDre']
  },
  {
    folders: [insertOneInterventionPni_1, '56-handleOneInterventionPniInvalidChanges'],
    expectedResults: [NexoImportStatus.SUCCESS, NexoImportStatus.FAILURE],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: ['57-insertSeveralInterventions', '58-updateAssetGeometry']
  },
  {
    folders: [insertOneInterventionPni_1, '59-acceptOneInterventionPni'],
    interventionActions: [[InterventionAction.ACCEPT], []]
  },
  {
    folders: [insertOneInterventionPni_1, '60-refuseOneInterventionPniAndAddAsset'],
    interventionActions: [[InterventionAction.REFUSE], []]
  },
  {
    folders: [insertOneInterventionPni_1, '61-acceptOneInterventionPniWithoutMajorChange'],
    interventionActions: [[InterventionAction.ACCEPT], []]
  },
  {
    folders: [insertOneInterventionPni_1, '62-refuseOneInterventionPniAndReplaceAsset'],
    interventionActions: [[InterventionAction.REFUSE], []]
  },
  {
    folders: [insertOneInterventionPi_4, '63-updateOneInterventionPi'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionDi_6, '64-updateOneInterventionDiToPni'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionPi_4, '65-updateOneInterventionPiToPni'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionPni_1, '66-handleOneInterventionPni'],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionPi_4, '67-updateOneInterventionPiInvalidChanges'],
    expectedResults: [NexoImportStatus.SUCCESS, NexoImportStatus.FAILURE],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionDi_6, '68-updateOneInterventionDi'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionDi_6, '69-updateOneInterventionDiWithMissingIntervention'],
    expectedResults: [NexoImportStatus.SUCCESS, NexoImportStatus.FAILURE],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.ADD_INTERVENTION,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionDi_6, '70-updateOneInterventionDi'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.ADD_INTERVENTION,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionPni_1, '71-handleOneInterventionPniInPi'],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_INTEGRATED_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.ADD_INTERVENTION,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionPni_1, '72-removeOneInterventionPniFromPi'],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_INTEGRATED_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.ADD_INTERVENTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionPni_1, '73-updateOneInterventionPniInPiInvalidChanges'],
    expectedResults: [NexoImportStatus.SUCCESS, NexoImportStatus.FAILURE],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_INTEGRATED_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.ADD_INTERVENTION,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionPni_1, '74-updateOneInterventionPniBasicChanges'],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionPni_1, '75-completePni'],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionPi_4, '76-completePi'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionDi_6, '77-completeInterventionDi'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionDi_6, '78-updateOneInterventionDiToPniWithAnotherIntervention'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.ADD_INTERVENTION,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [budgetDataOneInterventionDi_52, '79-budgetDataUpdateOneInterventionDiWithProject'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionDi_6, '80-uncancelOneInterventionDi'],
    interventionActions: [[InterventionAction.CANCEL], []]
  },
  {
    folders: [insertOneInterventionPni_1, '81-uncancelOneInterventionPni'],
    interventionActions: [[InterventionAction.CANCEL], []]
  },
  {
    folders: [insertOneInterventionDi_6, '82-cancelOneCanceledInterventionDi'],
    interventionActions: [[InterventionAction.CANCEL], []]
  },
  {
    folders: [insertOneInterventionPni_1, '83-cancelOneCanceledInterventionPni'],
    interventionActions: [[InterventionAction.CANCEL], []]
  },
  {
    folders: [insertOneInterventionPni_1, '84-cancelOneInterventionPniPlanned'],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionDi_6, '85-cancelOneInterventionDiPlanned'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionDi_6, '86-cancelOneInterventionDiPlannedWithAnotherIntervention'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_INTERVENTION,
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionPni_1, '87-cancelOneInterventionPniProgrammed'],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionPni_1, '88-cancelOneInterventionPniFinalOrdered'],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionDi_6, '89-cancelOneInterventionPiProgrammed'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionDi_6, '90-cancelOneInterventionPiFinalOrdered'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionDi_6, '91-cancelOneInterventionPiProgrammedWithAnotherIntervention'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_INTERVENTION,
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionDi_6, '92-cancelOneInterventionPiFinalOrderedWithAnotherIntervention'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_INTERVENTION,
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionPni_1, '93-cancelOneInterventionPniProgrammedWithAnotherIntervention'],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_INTEGRATED_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_INTERVENTION,
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK
      ],
      []
    ]
  },
  {
    folders: ['94-insertOneInterventionPniDi', '95-cancelOneInterventionPniWithAnotherIntervention'],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_INTEGRATED_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_INTERVENTION,
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: ['96-rehabAqConceptionEmptyFile'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['97-rehabAqConceptionWrongHeader'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['98-rehabAqConceptionHeaderWithEmptyRow'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['99-rehabAqConceptionMissingDateMAJ'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['100-rehabAqConceptionNoAssociatedIntervention'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['101-rehabAqConceptionMoreThanOneAssociatedIntervention'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['102-rehabAqConceptionEqualDateMAJ']
  },
  {
    folders: ['103-rehabAqConceptionAnteriorDateMAJ'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['104-rehabAqConceptionTypeActifAmontNotInTaxonomy'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['105-rehabAqConceptionTypeActifAvalNotInTaxonomy'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['106-rehabAqConceptionPlageContratInvalidValue'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['107-rehabAqConceptionInterventionWithoutProgram'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['108-rehabAqConceptionInterventionWithWrongProgram'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['109-rehabAqConceptionDoubleEntry']
  },
  {
    folders: ['110-rehabAqConceptionAddDesignDataToInterventionWithoutDesignData']
  },
  {
    folders: [
      '110-rehabAqConceptionAddDesignDataToInterventionWithoutDesignData',
      '111-rehabAqConceptionReplaceExistingDesignDataInIntervention'
    ]
  },
  {
    folders: [
      '110-rehabAqConceptionAddDesignDataToInterventionWithoutDesignData',
      '112-rehabAqConceptionDeleteExistingDesignDataInIntervention'
    ]
  },
  {
    folders: ['113-rehabAqConceptionAddPartialDesignDataToInterventionWithoutDesignData']
  },
  {
    folders: ['114-insertInterventionWithBudgetAndRehabAqConceptionData']
  },
  {
    folders: ['115-rehabAqConceptionOnlyHeader'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: [insertOneInterventionPni_1, '116-pniReplaceAsset']
  },
  {
    folders: ['2-insertSeveralLinkedInterventionsPni', '117-pniReplaceAllAssets'],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK
      ],
      []
    ]
  },
  {
    folders: [insertOneInterventionPi_4, '118-piReplaceAllAssets'],
    interventionActions: [
      [
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ]
  },
  {
    folders: ['2-insertSeveralLinkedInterventionsPni', '119-pniReplaceAllAssetsWithInvalidUpdates'],
    expectedResults: [NexoImportStatus.SUCCESS, NexoImportStatus.FAILURE],
    interventionActions: [
      [
        InterventionAction.ACCEPT,
        InterventionAction.ADD_COMMENT,
        InterventionAction.ADD_DOCUMENT,
        InterventionAction.ADD_REQUIREMENT,
        InterventionAction.CREATE_PROJECT,
        InterventionAction.UPDATE_ANNUAL_DISTRIBUTION
      ],
      []
    ],
    projectActions: [
      [
        ProjectAction.ADD_COMMENT,
        ProjectAction.ADD_DOCUMENT,
        ProjectAction.ADD_REQUIREMENT,
        ProjectAction.UPDATE_ANNUAL_DISTRIBUTION,
        ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK,
        ProjectAction.CREATE_SUBMISSION
      ],
      []
    ]
  },
  {
    folders: ['120-rehabEgConceptionMissingNoProjet'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['121-rehabEgConceptionMissingNoConduite'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['122-rehabEgConceptionMissingDateMAJ'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['123-rehabEgConceptionDifferentPlageContrat'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['124-rehabEgConceptionDifferentDateMAJ'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['125-rehabEgConceptionTypeActifAmontNotInTaxonomy'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['126-rehabEgConceptionTypeActifAvalNotInTaxonomy'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['127-rehabEgConceptionInvalidPlageContrat'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['128-rehabEgConceptionInvalidInfiltration'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['129-rehabEgConceptionInvalidObstruction'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['130-rehabEgConceptionNoAssociatedIntervention'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['131-rehabEgConceptionMoreThanOneAssociatedIntervention'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['132-rehabEgConceptionAnteriorDateMAJ'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['133-rehabEgConceptionInterventionWithoutProgram'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['134-rehabEgConceptionInterventionWithWrongProgram'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['135-rehabEgConceptionMissingAssetInIntervention'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['136-rehabEgConceptionAddAssetDesignDataToAssetWithoutAssetDesignData']
  },
  {
    folders: [
      '136-rehabEgConceptionAddAssetDesignDataToAssetWithoutAssetDesignData',
      '137-rehabEgConceptionReplaceExistingAssetDesignDataInAssetOfIntervention'
    ]
  },
  {
    folders: [
      '136-rehabEgConceptionAddAssetDesignDataToAssetWithoutAssetDesignData',
      '138-rehabEgConceptionDeleteExistingAssetDesignDataInAssetOfIntervention'
    ]
  },
  {
    folders: ['139-rehabEgConceptionAddPartialAssetDesignDataInAssetOfInterventionWithoutAssetDesignData']
  },
  {
    folders: [
      '136-rehabEgConceptionAddAssetDesignDataToAssetWithoutAssetDesignData',
      '140-rehabEgConceptionUpdateInterventionWithoutAffectingAssetDesignData'
    ]
  },
  {
    folders: [
      '110-rehabAqConceptionAddDesignDataToInterventionWithoutDesignData',
      '141-rehabAqConceptionUpdateInterventionWithoutAffectingDesignData'
    ]
  },
  {
    folders: ['142-insertInterventionWithBudgetDataAndRehabEqConceptionData']
  },
  {
    folders: ['143-insertInterventionsWithRehabAqConceptionDataAndRehabEqConceptionData']
  },
  {
    folders: ['144-insertInterventionsWithBudgetDataAndRehabAqConceptionDataAndRehabEqConceptionData']
  },
  {
    folders: ['145-rehabEgConceptionEmptyFile'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['146-rehabEgConceptionWrongHeader'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['147-rehabEgConceptionHeaderWithEmptyRow'],
    expectedResults: [NexoImportStatus.FAILURE]
  },
  {
    folders: ['148-rehabAqConceptionMissingNoProjet'],
    expectedResults: [NexoImportStatus.FAILURE]
  }
];

// tslint:disable:max-func-body-length
describe(`startNexoImportUseCase`, () => {
  let nexoImportLog: NexoImportLog;

  async function setNexoImportLog(extraFilesTypes: NexoFileType[] = []) {
    const files = [
      getNexoImportFile({
        type: NexoFileType.INTERVENTIONS_SE,
        storageId: INTERVENTIONS_SE_FILE_STORAGE_ID
      })
    ];

    if (!isEmpty(extraFilesTypes)) {
      const extraFilesIds = {
        [NexoFileType.INTERVENTIONS_BUDGET_SE]: INTERVENTIONS_BUDGET_SE_FILE_STORAGE_ID,
        [NexoFileType.REHAB_AQ_CONCEPTION]: REHAB_AQ_CONCEPTION_FILE_STORAGE_ID,
        [NexoFileType.REHAB_EG_CONCEPTION]: REHAB_EG_CONCEPTION_FILE_STORAGE_ID
      };
      extraFilesTypes.forEach(type => {
        files.push(
          getNexoImportFile({
            type,
            storageId: extraFilesIds[type]
          })
        );
      });
    }

    nexoImportLog = (
      await nexoImportLogRepository.save(
        getNexoImportLog({
          status: NexoImportStatus.PENDING,
          files
        })
      )
    ).getValue();
  }

  before(async () => {
    await setTestApp();
  });

  after(async () => {
    await deleteNexoBookTaxonomy();
    // reset taxonomies cache
    taxonomyService.reset();
  });

  beforeEach(async () => {
    await insertNexoBookTaxonomy();
    // reset taxonomies cache
    taxonomyService.reset();
    counterRepository.resetTestingModeSequence();
    storageApiServiceStub.initUploadStub(sandbox);
    spatialAnalysisServiceStub.init(sandbox);
    const featureMock = getFeature({
      properties: {
        id: 'R145'
      }
    });
    sandbox.stub(spatialAnalysisService, 'getFeaturesByIds').resolves(Result.ok([featureMock]));
    userMocker.mock(userMocks.admin);
  });

  afterEach(async () => {
    await destroyDBTests();
    sandbox.restore();
    userMocker.reset();
  });

  describe(`Positive`, () => {
    const DATAS_FOLDER_NAME = 'datas';
    const baseDatasTestsPath = path.resolve(__dirname, DATAS_FOLDER_NAME);

    testScenarios.forEach(scenario => {
      it(`should run nexoImport case ${scenario.folders[scenario.folders.length - 1]}`, async () => {
        for (const [i, folder] of scenario.folders.entries()) {
          const currentFolderPath = path.resolve(baseDatasTestsPath, folder);
          let inputDataInterventionsFilePath: any;
          let inputDataBudgetFilePath: any;
          let inputDataRehabAqConceptionFilePath: any;
          let inputDataRehabEgConceptionFilePath: any;
          let expectedInterventionResults: IEnrichedIntervention[];
          let expectedProjectsResults: IEnrichedProject[];
          let expectedImportLogResults: INexoImportLog;
          let expectedRequirementResults: IRequirement[];
          let expectedAnnualProgramResults: IEnrichedAnnualProgram[];
          let expectedProgramBookResults: IEnrichedProgramBook[];
          let expectedSubmissionResults: ISubmission[];
          // set datas files
          readdirSync(currentFolderPath).forEach(file => {
            if (file.includes('budgetData.xlsx')) {
              inputDataBudgetFilePath = file;
            } else if (file.includes('rehabAqConceptionData.xlsx')) {
              inputDataRehabAqConceptionFilePath = file;
            } else if (file.includes('rehabEgConceptionData.xlsx')) {
              inputDataRehabEgConceptionFilePath = file;
            } else if (file.includes('.xlsx')) {
              inputDataInterventionsFilePath = file;
            } else if (file.includes('intervention')) {
              expectedInterventionResults = readFile(file, currentFolderPath);
            } else if (file.includes('project')) {
              expectedProjectsResults = readFile(file, currentFolderPath);
            } else if (file.includes('log')) {
              expectedImportLogResults = readFile(file, currentFolderPath);
            } else if (file.includes('requirement')) {
              expectedRequirementResults = readFile(file, currentFolderPath);
            } else if (file.includes('annualProgram')) {
              expectedAnnualProgramResults = readFile(file, currentFolderPath);
            } else if (file.includes('programBook')) {
              expectedProgramBookResults = readFile(file, currentFolderPath);
            } else if (file.includes('submission')) {
              expectedSubmissionResults = readFile(file, currentFolderPath);
            }
          });

          // Setup nexoImport according to scenario
          const extraFiles = inputDataBudgetFilePath ? [NexoFileType.INTERVENTIONS_BUDGET_SE] : [];
          if (inputDataRehabAqConceptionFilePath) {
            extraFiles.push(NexoFileType.REHAB_AQ_CONCEPTION);
          }
          if (inputDataRehabEgConceptionFilePath) {
            extraFiles.push(NexoFileType.REHAB_EG_CONCEPTION);
          }
          await setNexoImportLog(extraFiles);

          stubDownload(
            sandbox,
            currentFolderPath,
            inputDataInterventionsFilePath,
            inputDataBudgetFilePath,
            inputDataRehabAqConceptionFilePath,
            inputDataRehabEgConceptionFilePath
          );

          const result = await startNexoImportUseCase.execute({
            id: nexoImportLog.id
          });
          assert.isTrue(result.isRight());

          let executedImportDTO: INexoImportLog;
          // give it a delay due to fire and forget
          do {
            await appUtils.delay(NEXO_DELAY + 500);
            executedImportDTO = await getNexoImportLogFromDB(nexoImportLog.id);
          } while (
            ![NexoImportStatus.SUCCESS, NexoImportStatus.FAILURE].includes(executedImportDTO.status as NexoImportStatus)
          );

          const expectedResult = scenario.expectedResults ? scenario.expectedResults[i] : NexoImportStatus.SUCCESS;
          assert.strictEqual(expectedResult, executedImportDTO.status, `should be ${expectedResult}`);
          assertResults<INexoImportLog>([executedImportDTO], [expectedImportLogResults], 'Nexo Import Log');

          // check that interventions have been created
          await assertInterventions(expectedInterventionResults);

          // check that project have been created
          await assertProjects(expectedProjectsResults);

          // check requirement
          await assertRequirements(expectedRequirementResults);

          // check annual program
          await assertAnnualPrograms(expectedAnnualProgramResults);

          // check program book
          await assertProgramBooks(expectedProgramBookResults);

          // check submissions
          await assertSubmissions(expectedSubmissionResults);

          const findInterventionsOptions = InterventionFindOptions.create({
            criterias: {}
          }).getValue();
          const importedInterventions = await interventionRepository.findAll(findInterventionsOptions);

          await doInterventionActions(
            scenario.interventionActions ? scenario.interventionActions[i] : [],
            importedInterventions
          );

          const findProjectsOptions = ProjectFindOptions.create({
            criterias: {},
            orderBy: '+createdAt'
          }).getValue();
          const projects = await projectRepository.findAll(findProjectsOptions);
          await doProjectActions(scenario.projectActions ? scenario.projectActions[i] : [], projects);

          if (i !== scenario.folders.length - 1) {
            sandbox.restore();
          }
        }
      });
    });
  });
});
