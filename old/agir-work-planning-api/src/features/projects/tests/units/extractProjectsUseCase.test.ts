import {
  AnnualProgramStatus,
  ErrorCodes,
  Permission,
  ProjectsExtractionSelectableFields as SelectableFields,
  ProjectStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as _ from 'lodash';
import * as sinon from 'sinon';
import { projectDataGenerator } from '../../../../../tests/data/dataGenerators/projectDataGenerator';
import { customUserMocks, userMocks } from '../../../../../tests/data/userMocks';
import { assertFailures, destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { ErrorCode } from '../../../../shared/domainErrors/errorCode';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { IDownloadFileResult } from '../../../../shared/storage/iStorageService';
import { enumValues } from '../../../../utils/enumUtils';
import { spreadsheetUtils } from '../../../../utils/spreadsheets/spreadsheetsUtils';
import { createAndSaveAnnualProgram } from '../../../annualPrograms/tests/annualProgramTestHelper';
import { createAndSaveProgramBook } from '../../../programBooks/tests/programBookTestHelper';
import { requirementRepository } from '../../../requirements/mongo/requirementRepository';
import { createAndSaveSubmission } from '../../../submissions/tests/submissionTestHelper';
import { IExtractProjectsCommandProps } from '../../useCases/extract/extractProjectsCommand';
import { extractProjectsUseCase } from '../../useCases/extract/extractProjectsUseCase';
import { partiallyEnrichedProjects } from './data/projectsData';
import { getRequirementsData } from './data/requirementsData';
import { getPartialSubmissionsPropsData } from './data/submissionsData';

// tslint:disable:max-func-body-length
describe(`ExtractProjectsUseCase`, () => {
  let clock: sinon.SinonFakeTimers;
  before(() => {
    clock = sinon.useFakeTimers(new Date('2022-10-22T10:00:00'));
  });
  after(() => {
    clock.restore();
  });
  describe(`Negative - Body parameters validation errors`, () => {
    before(() => {
      userMocker.mock(userMocks.partnerProjectConsultation);
    });
    after(() => {
      userMocker.reset();
    });
    [
      {
        description: 'fields body parameter is missing',
        commandProps: {
          year: 2022,
          fields: undefined
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'fields',
            code: ErrorCodes.MissingValue,
            message: `fields is null or undefined`
          }
        ]
      },
      {
        description: 'fields body parameter is an empty array',
        commandProps: {
          year: 2022,
          fields: []
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'fields',
            code: ErrorCodes.InvalidInput,
            message: `fields is empty`
          }
        ]
      },
      {
        description: 'year is missing',
        commandProps: {
          year: undefined,
          fields: [SelectableFields.id, SelectableFields.projectName]
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'year',
            code: ErrorCodes.MissingValue,
            message: `year is null or undefined`
          }
        ]
      },
      {
        description: 'year is not a positive integer',
        commandProps: {
          year: 2000.4,
          fields: [SelectableFields.id, SelectableFields.projectName]
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'year',
            code: ErrorCodes.InvalidInput,
            message: `year is not a positive integer`
          }
        ]
      },
      {
        description: 'fromBudget is not zero or a positive integer',
        commandProps: {
          year: 2002,
          fields: [SelectableFields.id, SelectableFields.projectName],
          fromBudget: 2.2
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'fromBudget',
            code: ErrorCodes.InvalidInput,
            message: `fromBudget is not zero or a positive integer`
          }
        ]
      },
      {
        description: 'toBudget is not zero or a positive integer',
        commandProps: {
          year: 2002,
          fields: [SelectableFields.id, SelectableFields.projectName],
          toBudget: -1
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'toBudget',
            code: ErrorCodes.InvalidInput,
            message: `toBudget is not zero or a positive number`
          }
        ]
      },
      {
        description: 'parameters are not in taxonomy',
        commandProps: {
          year: 2002,
          fields: [SelectableFields.id, SelectableFields.projectName],
          projectTypeId: ['fake-projectTypeId'],
          executorId: ['fake-executorId'],
          categoryId: ['fake-categoryId'],
          subCategoryId: ['fake-subCategoryId'],
          boroughId: ['VM', 'fake-boroughId'],
          status: ['fake-status'],
          workTypeId: ['fake-workTypeId'],
          medalId: ['fake-medalId']
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectTypeId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-projectTypeId' is invalid for taxonomy group: '${TaxonomyGroup.projectType}'`
          },
          {
            succeeded: false,
            target: 'executorId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-executorId' is invalid for taxonomy group: '${TaxonomyGroup.executor}'`
          },
          {
            succeeded: false,
            target: 'categoryId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-categoryId' is invalid for taxonomy group: '${TaxonomyGroup.projectCategory}'`
          },
          {
            succeeded: false,
            target: 'subCategoryId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-subCategoryId' is invalid for taxonomy group: '${TaxonomyGroup.projectSubCategory}'`
          },
          {
            succeeded: false,
            target: SelectableFields.boroughId,
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-boroughId' is invalid for taxonomy group: '${TaxonomyGroup.borough}'`
          },
          {
            succeeded: false,
            target: 'status',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-status' is invalid for taxonomy group: '${TaxonomyGroup.projectStatus}'`
          },
          {
            succeeded: false,
            target: 'workTypeId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-workTypeId' is invalid for taxonomy group: '${TaxonomyGroup.workType}'`
          },
          {
            succeeded: false,
            target: 'medalId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-medalId' is invalid for taxonomy group: '${TaxonomyGroup.medalType}'`
          }
        ]
      },
      {
        description: 'fields body param contains unsupported fields',
        commandProps: {
          year: 2002,
          fields: [SelectableFields.id, SelectableFields.projectName, 'interventionName']
        },
        errorType: UnprocessableEntityError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'fields',
            code: ErrorCodes.InvalidInput,
            message: `'interventionName' is not a selectable field`
          }
        ]
      },
      {
        description: 'the requirements field is selected without the user having the REQUIREMENT_READ permission',
        commandProps: {
          year: 2002,
          fields: [
            SelectableFields.id,
            SelectableFields.projectName,
            SelectableFields.requirements,
            SelectableFields.boroughId
          ]
        },
        errorType: ForbiddenError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'fields',
            code: ErrorCode.FORBIDDEN,
            message: `The '${Permission.REQUIREMENT_READ}' permission is required to select the 'requirements' field`
          }
        ]
      },
      {
        description:
          'the annualDistribution.annualPeriods.programBookId field is selected without the user having the PROGRAM_BOOK:READ permission',
        commandProps: {
          year: 2002,
          fields: [
            SelectableFields.id,
            SelectableFields.projectName,
            SelectableFields.annualPeriodsProgramBookId,
            SelectableFields.boroughId
          ]
        },
        errorType: ForbiddenError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'fields',
            code: ErrorCode.FORBIDDEN,
            message: `The '${Permission.PROGRAM_BOOK_READ}' permission is required to select the 'annualDistribution.annualPeriods.programBookId' field`
          }
        ]
      },
      {
        description: 'the designRequirements field is selected without the user having the SUBMISSION:READ permission',
        commandProps: {
          year: 2002,
          fields: [
            SelectableFields.id,
            SelectableFields.projectName,
            SelectableFields.designRequirements,
            SelectableFields.boroughId
          ]
        },
        errorType: ForbiddenError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'fields',
            code: ErrorCode.FORBIDDEN,
            message: `The '${Permission.SUBMISSION_READ}' permission is required to select the 'designRequirements' field`
          }
        ]
      },
      {
        description: 'a parameter is not supported',
        commandProps: {
          year: 2002,
          fields: [SelectableFields.id, SelectableFields.projectName, SelectableFields.boroughId],
          shouldNotBe: ['here']
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'ProjectExtractSearchRequest',
            code: 'openApiInputValidator',
            message: `Target property 'shouldNotBe' is not in the model`
          }
        ]
      },
      {
        description: 'a parameter has the wrong type',
        commandProps: {
          year: 2002,
          fields: [SelectableFields.id, SelectableFields.projectName, SelectableFields.boroughId],
          executorId: [4]
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'ProjectExtractSearchRequest',
            code: 'openApiInputValidator',
            message: `executorId0 (4) is not a type of string`
          }
        ]
      },
      {
        description: "a parameter's length is too high",
        commandProps: {
          year: 2002,
          fields: [SelectableFields.id, SelectableFields.projectName, SelectableFields.boroughId],
          executorId: ['x'.repeat(51)]
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'ProjectExtractSearchRequest',
            code: 'openApiInputValidator',
            message: `executorId0 must be no more than 50 characters long`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const result = await extractProjectsUseCase.execute(test.commandProps as IExtractProjectsCommandProps);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, test.errorType);
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  describe('Positive - Successful extractions', () => {
    const projectIds: any = {}; // Used to work around id generation irregularities
    before(async () => {
      // Create annual programs for program books
      const [annualProgram2000, annualProgram2001, annualProgram2022, annualProgram2023] = [
        await createAndSaveAnnualProgram({
          year: 2000,
          status: AnnualProgramStatus.programming
        }),
        await createAndSaveAnnualProgram({
          year: 2001,
          status: AnnualProgramStatus.programming
        }),
        await createAndSaveAnnualProgram({
          year: 2022,
          status: AnnualProgramStatus.programming
        }),
        await createAndSaveAnnualProgram({
          year: 2023,
          status: AnnualProgramStatus.programming
        })
      ];

      // Create programBooks
      const programBooks = [
        await createAndSaveProgramBook({
          annualProgram: annualProgram2022,
          name: 'programBook1'
        }),
        await createAndSaveProgramBook({
          annualProgram: annualProgram2023,
          name: 'programBook2'
        }),
        await createAndSaveProgramBook({
          annualProgram: annualProgram2000,
          name: 'programBook3'
        }),
        await createAndSaveProgramBook({
          annualProgram: annualProgram2001,
          name: 'programBook4'
        })
      ];

      // Set program book ids on projects
      const projectsToCreate = _.cloneDeep(partiallyEnrichedProjects);
      projectsToCreate.forEach(project => {
        project.annualDistribution?.annualPeriods?.forEach(period => {
          programBooks.forEach(programBook => {
            if (period.programBookId === programBook.name) {
              period.programBookId = programBook.id;
            }
          });
        });
      });

      // Insert projects in database
      for (const partiallyEnrichedProject of projectsToCreate) {
        const createdProject = await projectDataGenerator.store(partiallyEnrichedProject);
        projectIds[createdProject.projectName] = createdProject.id;
      }

      // Insert requirements for those projects in database
      await requirementRepository.saveBulk(getRequirementsData(projectIds));

      // Insert submissions with design requirements for those projects in database
      for (const submissionProps of getPartialSubmissionsPropsData(projectIds)) {
        await createAndSaveSubmission(submissionProps);
      }
    });
    after(async () => {
      await destroyDBTests();
    });

    afterEach(() => {
      userMocker.reset();
    });

    [
      {
        description: 'Extract projects fields: id, boroughId, projectName, status',
        command: {
          year: 2022,
          fields: [
            SelectableFields.id,
            SelectableFields.boroughId,
            SelectableFields.projectName,
            SelectableFields.status
          ]
        },
        expectedHeaders: ['ID', 'Arrondissement', 'Libellé', 'Statut'],
        expectedRows: [
          {
            iD: 'project3',
            arrondissement: 'Anjou',
            libellé: 'project3',
            statut: 'Programmé'
          },
          {
            iD: 'project2',
            arrondissement: 'Ville-Marie',
            libellé: 'project2',
            statut: 'Replanifié'
          },
          {
            iD: 'project1',
            arrondissement: 'Ville-Marie',
            libellé: 'project1',
            statut: 'Programmé'
          }
        ]
      },
      {
        description: 'Extract fields of programmed projects: id, boroughId, projectName, status',
        command: {
          year: 2022,
          fields: [
            SelectableFields.id,
            SelectableFields.boroughId,
            SelectableFields.projectName,
            SelectableFields.status
          ],
          status: [ProjectStatus.programmed]
        },
        expectedHeaders: ['ID', 'Arrondissement', 'Libellé', 'Statut'],
        expectedRows: [
          {
            iD: 'project3',
            arrondissement: 'Anjou',
            libellé: 'project3',
            statut: 'Programmé'
          },
          {
            iD: 'project1',
            arrondissement: 'Ville-Marie',
            libellé: 'project1',
            statut: 'Programmé'
          }
        ]
      },
      {
        description: 'Extract projects without PROJECT:READ:ALL permission',
        command: {
          year: 2022,
          fields: [SelectableFields.projectName, SelectableFields.startYear, SelectableFields.boroughId]
        },
        userMock: userMocks.partnerProjectConsultation,
        expectedHeaders: [],
        expectedRows: []
      },
      {
        description: 'Extract projects restricted fields without corresponding read permissions',
        command: {
          year: 2022,
          fields: [
            SelectableFields.projectName,
            SelectableFields.globalBudgetAllowance,
            SelectableFields.interventionIds
          ]
        },
        userMock: customUserMocks.restrictedOnProjectsExtractionFields,
        expectedHeaders: ['Libellé', 'Budget ($)', "Nombre d'interventions", 'IDs des interventions'],
        expectedRows: [
          {
            libellé: 'project3'
          },
          {
            libellé: 'project2'
          },
          {
            libellé: 'project1'
          }
        ]
      },
      {
        description: 'Extract projects restricted fields with corresponding read permissions',
        command: {
          year: 2022,
          fields: [
            SelectableFields.projectName,
            SelectableFields.globalBudgetAllowance,
            SelectableFields.interventionIds
          ]
        },
        expectedHeaders: ['Libellé', 'Budget ($)', "Nombre d'interventions", 'IDs des interventions'],
        expectedRows: [
          {
            libellé: 'project3',
            'budget ($)': 33330,
            "nombre d'interventions": 3,
            'iDs des interventions': 'intervention4 ; intervention5 ; intervention6'
          },
          {
            libellé: 'project2',
            'budget ($)': 22200,
            "nombre d'interventions": 1,
            'iDs des interventions': 'intervention3'
          },
          {
            libellé: 'project1',
            ['budget ($)']: 100000,
            ["nombre d'interventions"]: 2,
            ['iDs des interventions']: 'intervention1 ; intervention2'
          }
        ]
      },
      {
        description: `Extract projects while having ${Permission.PROJECT_WITH_POSTPONED_DECISION_READ} without the ${Permission.PROJECT_READ_ALL} permission`,
        command: {
          year: 2010,
          fields: [SelectableFields.projectName]
        },
        userMock: userMocks.executor,
        expectedHeaders: ['Libellé'],
        expectedRows: [
          {
            libellé: 'project6'
          },
          {
            libellé: 'project5'
          }
        ]
      },
      {
        description: 'Extract projects requirements',
        command: {
          year: 2022,
          fields: [SelectableFields.projectName, SelectableFields.requirements]
        },
        expectedHeaders: ['Libellé', 'Exigences de planification'],
        expectedRows: [
          {
            libellé: 'project3'
          },
          {
            libellé: 'project2',
            'exigences de planification': `Autre - Autres exigences :\nThis is a requirement.`
          },
          {
            libellé: 'project1',
            'exigences de planification': [
              `Programmation - Coordination avec les travaux dans le secteur :\n`,
              `Il faut plus de coordination.\n\n`,
              `Programmation - Coordination avec les entraves des autres partenaires :\n`,
              `Il faut de la coordination.`
            ].join('')
          }
        ]
      },
      {
        description: 'Extract projects program books',
        command: {
          year: 2022,
          fields: [SelectableFields.projectName, SelectableFields.annualPeriodsProgramBookId]
        },
        expectedHeaders: ['Libellé', 'Carnet(s)'],
        expectedRows: [
          {
            libellé: 'project3',
            'carnet(s)': '2022 | programBook1'
          },
          {
            libellé: 'project2'
          },
          {
            libellé: 'project1',
            'carnet(s)': '2022 | programBook1 ; 2023 | programBook2'
          }
        ]
      },
      {
        description: 'Extract projects design requirements',
        command: {
          year: 2022,
          fields: [SelectableFields.projectName, SelectableFields.designRequirements]
        },
        expectedHeaders: ['Libellé', 'Exigences de conception'],
        expectedRows: [
          {
            libellé: 'project3',
            'exigences de conception':
              "Avant appel d'offre - Réalisation des travaux - Coordination avec les travaux dans le secteur :\nworkworkworkworkwork"
          },
          {
            libellé: 'project2',
            'exigences de conception':
              "Avant appel d'offre - Période de réalisation - Autre - Obsolète :\nblabla\n\nAprès appel d’offre - Programmation - Printemps :\nshpring"
          },
          {
            libellé: 'project1'
          }
        ]
      },
      {
        description: 'Extract all fields of a project that has only values for its mandatory fields',
        command: {
          year: 2018,
          fields: enumValues<string>(SelectableFields)
        },
        expectedHeaders: [
          'ID',
          'Libellé',
          'Année de début',
          'Année de fin',
          'Statut',
          'Date statut',
          'Nature du projet',
          'Type',
          'Catégorie',
          'Sous-catégorie',
          'Budget ($)',
          'Longueur (m)',
          'Requérant initial',
          'Exécutant',
          'Médaille',
          'Arrondissement',
          'Voie',
          'Voie de',
          'Voie à',
          "Nombre d'interventions",
          'IDs des interventions',
          'Carnet(s)',
          'Numéro de soumission',
          'Type de risque',
          'Type de réseau',
          'Priorité de service',
          'ID externe',
          'Exigences de planification',
          'Exigences de conception'
        ],
        expectedRows: [
          {
            'année de début': 2018,
            'année de fin': 2018,
            arrondissement: 'Pierrefonds-Roxboro',
            'budget ($)': 0,
            catégorie: '2018 | Nouveau',
            exécutant: 'Direction des infrastructures',
            iD: 'project0',
            libellé: 'project0',
            'nature du projet': 'Géolocalisé',
            "nombre d'interventions": 0,
            statut: 'Replanifié',
            type: 'PI - Standard'
          }
        ]
      },
      {
        description: 'Extract all fields of a project that has values for all selectable fields',
        command: {
          year: 2000,
          fields: enumValues<string>(SelectableFields)
        },
        expectedHeaders: [
          'ID',
          'Libellé',
          'Année de début',
          'Année de fin',
          'Statut',
          'Date statut',
          'Nature du projet',
          'Type',
          'Catégorie',
          'Sous-catégorie',
          'Budget ($)',
          'Longueur (m)',
          'Requérant initial',
          'Exécutant',
          'Médaille',
          'Arrondissement',
          'Voie',
          'Voie de',
          'Voie à',
          "Nombre d'interventions",
          'IDs des interventions',
          'Carnet(s)',
          'Numéro de soumission',
          'Type de risque',
          'Type de réseau',
          'Priorité de service',
          'ID externe',
          'Exigences de planification',
          'Exigences de conception'
        ],
        expectedRows: [
          {
            'année de début': 2000,
            'année de fin': 2002,
            arrondissement: 'Le Sud-Ouest',
            'budget ($)': 2000,
            'carnet(s)': '2000 | programBook3 ; 2001 | programBook4',
            catégorie: '2000 | Nouveau ; 2001 | Reporté ; 2002 | Parachèvement',
            'date statut': new Date('2022-12-12T12:12:12.000Z'),
            // The '’' character is displayed properly when the file is decoded with utf8
            'exigences de conception':
              'Après appel d offre - Autre - Autre - Obsolète :\nblabla\n\nAprès appel d offre - Programmation - Vacances scolaires :\nbloublou',
            'exigences de planification':
              'Programmation - Coordination avec les travaux dans le secteur :\nRequis 2.\n\nProgrammation - Coordination avec les entraves des autres partenaires :\nRequis 1.',
            exécutant: 'Direction des infrastructures',
            iD: 'project7',
            'iD externe': 'infoRtuId',
            'iDs des interventions': 'intervention1 ; intervention2 ; intervention3',
            libellé: 'project7',
            'longueur (m)': 1,
            médaille: 'Platine',
            'nature du projet': 'Géolocalisé',
            "nombre d'interventions": 3,
            'numéro de soumission': 1200,
            'priorité de service':
              "Service de l'eau - 2 - Haute priorité ; Service de l'urbanisme et de la mobilité - 3 - Moyenne priorité ; Service de l'eau - 4 - Basse priorité",
            'requérant initial': 'Bell Canada',
            'sous-catégorie': 'Prioritaire ; Urgent ; Successif',
            statut: 'Reporté',
            type: 'PI - Standard',
            'type de risque': 'Risque entente',
            'type de réseau': 'Local',
            voie: 'Nom de la rue',
            'voie de': 'Nom amont',
            'voie à': 'Nom aval'
          }
        ]
      }
    ].forEach(test => {
      it(`${test.description}`, async () => {
        if (test.userMock) {
          userMocker.mock(test.userMock);
        }
        const result = await extractProjectsUseCase.execute(test.command);
        assert.isTrue(result.isRight());

        const file = result.value.getValue() as IDownloadFileResult;
        assert.strictEqual(file.metadata.contentLength, file.data.length);
        assert.strictEqual(file.metadata.contentType, 'text/csv');
        assert.isTrue(file.metadata.objectName.startsWith('projects_extraction_2022-10-22_10'));
        assert.isTrue(file.metadata.objectName.endsWith('.csv'));
        assert.strictEqual(file.metadata.objectName.length, 43);

        file.data = file.data.toString('utf16le') as any;
        const workSheet = spreadsheetUtils.getWorkSheetFromFile(file, { type: 'string' }).getValue();
        const headers = spreadsheetUtils.getCsvColumnHeaders(workSheet).getValue();
        const jsonRows = spreadsheetUtils.workSheetToJSON(workSheet).getValue();
        assert.deepStrictEqual(headers, test.expectedHeaders);

        // Set expected row ids from generated ids
        test.expectedRows.forEach((row: any) => {
          if (row.iD) {
            row.iD = projectIds[row.iD];
          }
        });
        assert.deepStrictEqual(jsonRows, test.expectedRows);
      });
    });
  });
});
