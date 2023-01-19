import {
  ErrorCodes,
  InterventionsExtractionSelectableFields as SelectableFields,
  InterventionStatus,
  Permission,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as sinon from 'sinon';
import { interventionDataGenerator } from '../../../../../tests/data/dataGenerators/interventionDataGenerator';
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
import { requirementRepository } from '../../../requirements/mongo/requirementRepository';
import { InterventionFindOptions } from '../../models/interventionFindOptions';
import { interventionRepository } from '../../mongo/interventionRepository';
import { IExtractInterventionsCommandProps } from '../../useCases/extract/extractInterventionsCommand';
import {
  extractInterventionsUseCase,
  selectableFieldToColumnTitle
} from '../../useCases/extract/extractInterventionsUseCase';
import { partiallyEnrichedInterventions } from './data/interventionsData';
import { getRequirementsData } from './data/requirementsData';

// tslint:disable:max-func-body-length
describe(`ExtractInterventionsUseCase`, () => {
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
          planificationYear: 2022,
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
          planificationYear: 2022,
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
        description: 'planificationYear is missing',
        commandProps: {
          planificationYear: undefined,
          fields: [SelectableFields.id, SelectableFields.interventionName]
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: SelectableFields.planificationYear,
            code: ErrorCodes.MissingValue,
            message: `planificationYear is null or undefined`
          }
        ]
      },
      {
        description: 'planificationYear is not a positive integer',
        commandProps: {
          planificationYear: 2000.4,
          fields: [SelectableFields.id, SelectableFields.interventionName]
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: SelectableFields.planificationYear,
            code: ErrorCodes.InvalidInput,
            message: `planificationYear is not a positive integer`
          }
        ]
      },
      {
        description: 'fromEstimate is not zero or a positive integer',
        commandProps: {
          planificationYear: 2002,
          fields: [SelectableFields.id, SelectableFields.interventionName],
          fromEstimate: 2.2
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'fromEstimate',
            code: ErrorCodes.InvalidInput,
            message: `fromEstimate is not zero or a positive integer`
          }
        ]
      },
      {
        description: 'toEstimate is not zero or a positive integer',
        commandProps: {
          planificationYear: 2002,
          fields: [SelectableFields.id, SelectableFields.interventionName],
          toEstimate: -1
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'toEstimate',
            code: ErrorCodes.InvalidInput,
            message: `toEstimate is not zero or a positive number`
          }
        ]
      },
      {
        description: 'parameters are not in taxonomy',
        commandProps: {
          planificationYear: 2002,
          fields: [SelectableFields.id, SelectableFields.interventionName],
          programId: ['par', 'fake-programId'],
          interventionTypeId: ['fake-interventionTypeId'],
          workTypeId: ['fake-workTypeId'],
          requestorId: ['fake-requestorId'],
          boroughId: ['VM', 'fake-boroughId'],
          decisionTypeId: ['fake-decisionTypeId'],
          status: ['fake-status'],
          executorId: ['fake-executorId'],
          medalId: ['fake-medalId'],
          assetTypeId: ['fake-assetTypeId', 'pavedShoulder']
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'programId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-programId' is invalid for taxonomy group: '${TaxonomyGroup.programType}'`
          },
          {
            succeeded: false,
            target: 'interventionTypeId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-interventionTypeId' is invalid for taxonomy group: '${TaxonomyGroup.interventionType}'`
          },
          {
            succeeded: false,
            target: 'workTypeId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-workTypeId' is invalid for taxonomy group: '${TaxonomyGroup.workType}'`
          },
          {
            succeeded: false,
            target: 'requestorId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-requestorId' is invalid for taxonomy group: '${TaxonomyGroup.requestor}'`
          },
          {
            succeeded: false,
            target: SelectableFields.boroughId,
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-boroughId' is invalid for taxonomy group: '${TaxonomyGroup.borough}'`
          },
          {
            succeeded: false,
            target: 'decisionTypeId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-decisionTypeId' is invalid for taxonomy group: '${TaxonomyGroup.interventionDecisionType}'`
          },
          {
            succeeded: false,
            target: SelectableFields.status,
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-status' is invalid for taxonomy group: '${TaxonomyGroup.interventionStatus}'`
          },
          {
            succeeded: false,
            target: 'executorId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-executorId' is invalid for taxonomy group: '${TaxonomyGroup.executor}'`
          },
          {
            succeeded: false,
            target: 'medalId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-medalId' is invalid for taxonomy group: '${TaxonomyGroup.medalType}'`
          },
          {
            succeeded: false,
            target: 'assetTypeId',
            code: ErrorCodes.Taxonomy,
            message: `Taxonomy code: 'fake-assetTypeId' is invalid for taxonomy group: '${TaxonomyGroup.assetType}'`
          }
        ]
      },
      {
        description: 'fields body param contains unsupported fields',
        commandProps: {
          planificationYear: 2002,
          fields: [SelectableFields.id, SelectableFields.interventionName, 'importFlag']
        },
        errorType: UnprocessableEntityError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'fields',
            code: ErrorCodes.InvalidInput,
            message: `'importFlag' is not a selectable field`
          }
        ]
      },
      {
        description: 'the requirements field is selected without the user having the REQUIREMENT_READ permission',
        commandProps: {
          planificationYear: 2002,
          fields: [
            SelectableFields.id,
            SelectableFields.interventionName,
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
        description: 'a parameter is not supported',
        commandProps: {
          planificationYear: 2002,
          fields: [SelectableFields.id, SelectableFields.interventionName, SelectableFields.boroughId],
          shouldNotBe: ['here']
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'InterventionExtractSearchRequest',
            code: 'openApiInputValidator',
            message: `Target property 'shouldNotBe' is not in the model`
          }
        ]
      },
      {
        description: 'a parameter has the wrong type',
        commandProps: {
          planificationYear: 2002,
          fields: [SelectableFields.id, SelectableFields.interventionName, SelectableFields.boroughId],
          programId: [4]
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'InterventionExtractSearchRequest',
            code: 'openApiInputValidator',
            message: `programId0 (4) is not a type of string`
          }
        ]
      },
      {
        description: "a parameter's length is too high",
        commandProps: {
          planificationYear: 2002,
          fields: [SelectableFields.id, SelectableFields.interventionName, SelectableFields.boroughId],
          programId: ['x'.repeat(51)]
        },
        errorType: InvalidParameterError,
        expectedErrors: [
          {
            succeeded: false,
            target: 'InterventionExtractSearchRequest',
            code: 'openApiInputValidator',
            message: `programId0 must be no more than 50 characters long`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const result = await extractInterventionsUseCase.execute(
          test.commandProps as IExtractInterventionsCommandProps
        );
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, test.errorType);
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  describe('Positive - Successful extractions', () => {
    const ids: any = {}; // Used to work around id generation irregularities
    before(async () => {
      // Insert interventions in database
      for (const partiallyEnrichedIntervention of partiallyEnrichedInterventions) {
        await interventionDataGenerator.store(partiallyEnrichedIntervention);
      }

      // Create list containing ids of every intervention previously created
      for (const intervention of await interventionRepository.findAll(
        InterventionFindOptions.create({ criterias: { status: enumValues(InterventionStatus) } }).getValue()
      )) {
        ids[intervention.interventionName] = intervention.id;
      }

      // Insert requirements for those interventions in database
      await requirementRepository.saveBulk(getRequirementsData(ids));
    });
    after(async () => {
      await destroyDBTests();
    });

    afterEach(() => {
      userMocker.reset();
    });

    [
      {
        description: 'Extract interventions fields: id, boroughId, interventionName, status',
        command: {
          planificationYear: 2022,
          fields: [
            SelectableFields.id,
            SelectableFields.boroughId,
            SelectableFields.interventionName,
            SelectableFields.status
          ]
        },
        expectedHeaders: ['ID', 'Arrondissement', 'Libellé', 'Statut'],
        expectedRows: [
          {
            iD: 'intervention3',
            arrondissement: 'Anjou',
            libellé: 'intervention3',
            statut: 'Intégrée'
          },
          {
            iD: 'intervention2',
            arrondissement: 'Ville-Marie',
            libellé: 'intervention2',
            statut: 'Intégrée'
          },
          {
            iD: 'intervention1',
            arrondissement: 'Ville-Marie',
            libellé: 'intervention1',
            statut: 'Acceptée'
          }
        ]
      },
      {
        description: 'Extract fields of accepted interventions: id, boroughId, interventionName, status',
        command: {
          planificationYear: 2022,
          fields: [
            SelectableFields.id,
            SelectableFields.boroughId,
            SelectableFields.interventionName,
            SelectableFields.status
          ],
          status: [InterventionStatus.accepted]
        },
        expectedHeaders: ['ID', 'Arrondissement', 'Libellé', 'Statut'],
        expectedRows: [
          {
            iD: 'intervention1',
            arrondissement: 'Ville-Marie',
            libellé: 'intervention1',
            statut: 'Acceptée'
          }
        ]
      },
      {
        description: 'Extract interventions without INTERVENTION:READ:ALL permission',
        command: {
          planificationYear: 2022,
          fields: [
            SelectableFields.interventionName,
            SelectableFields.planificationYear,
            SelectableFields.estimateAllowance,
            SelectableFields.interventionYear,
            SelectableFields.contact
          ]
        },
        userMock: userMocks.partnerProjectConsultation,
        expectedHeaders: [],
        expectedRows: []
      },
      {
        description: 'Extract interventions restricted fields without corresponding read permissions',
        command: {
          planificationYear: 2022,
          fields: [
            SelectableFields.interventionName,
            SelectableFields.planificationYear,
            SelectableFields.estimateAllowance,
            SelectableFields.interventionYear,
            SelectableFields.contact
          ]
        },
        userMock: customUserMocks.restrictedOnInterventionsExtractionFields,
        expectedHeaders: [
          'Libellé',
          'Année planifiée',
          'Estimation budgétaire ($)',
          'Année initiale souhaitée',
          'Contact'
        ],
        expectedRows: [
          {
            libellé: 'intervention3',
            'année planifiée': 2022
          },
          {
            libellé: 'intervention2',
            'année planifiée': 2022
          },
          {
            libellé: 'intervention1',
            'année planifiée': 2022
          }
        ]
      },
      {
        description: 'Extract interventions restricted fields with corresponding read permissions',
        command: {
          planificationYear: 2022,
          fields: [
            SelectableFields.interventionName,
            SelectableFields.planificationYear,
            SelectableFields.estimateAllowance,
            SelectableFields.interventionYear,
            SelectableFields.contact
          ]
        },
        expectedHeaders: [
          'Libellé',
          'Année planifiée',
          'Estimation budgétaire ($)',
          'Année initiale souhaitée',
          'Contact'
        ],
        expectedRows: [
          {
            libellé: 'intervention3',
            'année planifiée': 2022,
            'estimation budgétaire ($)': 0,
            'année initiale souhaitée': 2022,
            contact: 'Contact3'
          },
          {
            libellé: 'intervention2',
            'année planifiée': 2022,
            'estimation budgétaire ($)': 1000000,
            'année initiale souhaitée': 2022,
            contact: 'Contact2'
          },
          {
            libellé: 'intervention1',
            'année planifiée': 2022,
            'estimation budgétaire ($)': 4000000,
            'année initiale souhaitée': 2022,
            contact: 'Contact1'
          }
        ]
      },
      {
        description: 'Extract interventions requirements',
        command: {
          planificationYear: 2022,
          fields: [SelectableFields.requirements, SelectableFields.interventionName]
        },
        expectedHeaders: ['Exigences de planification', 'Libellé'],
        expectedRows: [
          {
            'exigences de planification': [
              `Programmation - Coordination avec les travaux dans le secteur :\n`,
              `Il faut plus de coordination.\n\n`,
              `Programmation - Coordination avec les entraves des autres partenaires :\n`,
              `Il faut de la coordination.`
            ].join(''),
            libellé: 'intervention3'
          },
          {
            'exigences de planification': `Autre - Autres exigences :\nThis is a requirement.`,
            libellé: 'intervention2'
          },
          {
            libellé: 'intervention1'
          }
        ]
      },
      {
        description: 'Extract all fields of an intervention that has only values for its mandatory fields',
        command: {
          planificationYear: 2023,
          fields: enumValues<string>(SelectableFields)
        },
        expectedHeaders: Object.values(selectableFieldToColumnTitle),
        expectedRows: [
          {
            'année initiale souhaitée': 2023,
            'année planifiée': 2023,
            arrondissement: 'Outremont',
            contact: 'test',
            'décision requise': 'Non',
            exécutant: "Direction de l'eau potable",
            iD: 'intervention4',
            libellé: 'intervention4',
            'nature des travaux': 'Abandon',
            'nombre de refus': 0,
            requérant: 'Bell Canada',
            statut: 'En attente',
            type: 'Besoin initial'
          }
        ]
      },
      {
        description: 'Extract all fields of an intervention that has values for all selectable fields',
        command: {
          planificationYear: 2025,
          fields: enumValues<string>(SelectableFields)
        },
        expectedHeaders: Object.values(selectableFieldToColumnTitle),
        expectedRows: [
          {
            iD: 'intervention5',
            libellé: 'intervention5',
            'année initiale souhaitée': 2024,
            'année planifiée': 2025,
            statut: 'Acceptée',
            'date statut': new Date('2022-12-12T13:12:12.000Z'),
            'date de création': new Date('2022-12-12T13:12:12.000Z'),
            type: 'Besoin initial',
            'nature des travaux': 'Réhabilitation',
            programme: 'Réhabilitation d aqueduc principal', // The '’' character is displayed properly when the file is decoded with utf8
            'estimation budgétaire ($)': 203000,
            'longueur (m)': 18,
            'type actif': 'Chaussée',
            requérant: 'Bell Canada',
            exécutant: "Direction de l'épuration des eaux usées",
            arrondissement: 'Le Plateau Mont-Royal',
            voie: 'Cest la rue',
            'voie de': 'Cest la rue de',
            'voie à': 'Cest la rue a',
            'nombre de refus': 2,
            'iD de Projet': 'id test de projet',
            'date de la dernière demande de révision': new Date('2022-12-11T13:12:12.000Z'),
            'décision requise': 'Oui',
            contact: 'Le contact',
            'type de réseau': 'Artériel',
            médaille: 'Or',
            'iD externe': 'extref1',
            'exigences de planification':
              'Programmation - Coordination avec les entraves des autres partenaires :\nReq 2.\n\nProgrammation - Coordination avec les travaux dans le secteur :\nReq 1.'
          }
        ]
      }
    ].forEach(test => {
      it(`${test.description}`, async () => {
        if (test.userMock) {
          userMocker.mock(test.userMock);
        }
        const result = await extractInterventionsUseCase.execute(test.command);
        assert.isTrue(result.isRight());

        const file = result.value.getValue() as IDownloadFileResult;
        assert.strictEqual(file.metadata.contentLength, file.data.length);
        assert.strictEqual(file.metadata.contentType, 'text/csv');
        assert.isTrue(file.metadata.objectName.startsWith('interventions_extraction_2022-10-22_10'));
        assert.isTrue(file.metadata.objectName.endsWith('.csv'));
        assert.strictEqual(file.metadata.objectName.length, 48);

        file.data = file.data.toString('utf16le') as any; // To fix encoding issues
        const workSheet = spreadsheetUtils.getWorkSheetFromFile(file, { type: 'string' }).getValue();
        const headers = spreadsheetUtils.getCsvColumnHeaders(workSheet).getValue();
        const jsonRows = spreadsheetUtils.workSheetToJSON(workSheet).getValue();
        assert.deepStrictEqual(headers, test.expectedHeaders);

        // Set expected row ids from generated ids
        test.expectedRows.forEach(row => {
          if (row.iD) {
            row.iD = ids[row.iD];
          }
        });
        assert.deepStrictEqual(jsonRows, test.expectedRows);
      });
    });
  });
});
