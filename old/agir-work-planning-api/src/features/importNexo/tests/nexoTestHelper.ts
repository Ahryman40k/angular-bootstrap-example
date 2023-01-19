import {
  IEnrichedIntervention,
  IEnrichedProject,
  INexoImportFile,
  INexoImportLog,
  InterventionExternalReferenceType,
  InterventionStatus,
  InterventionType,
  ITaxonomy,
  ModificationType,
  NexoFileType,
  NexoImportStatus,
  ProgramBookStatus,
  ProjectExpand,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { get, isNil, range } from 'lodash';
import * as uuid from 'uuid';

import { mergeProperties } from '../../../../tests/utils/testHelper';
import { Result } from '../../../shared/logic/result';
import { PROGRAM_TYPE_PAR, PROGRAM_TYPE_PCPR, PROGRAM_TYPE_SSR } from '../../../shared/taxonomies/constants';
import { IUploadFileProps, UploadFile } from '../../../shared/upload/uploadFile';
import { enumValues } from '../../../utils/enumUtils';
import { spreadsheetUtils } from '../../../utils/spreadsheets/spreadsheetsUtils';
import { appUtils, isEmpty } from '../../../utils/utils';
import { getAnnualProgram } from '../../annualPrograms/tests/annualProgramTestHelper';
import { getFeature } from '../../asset/tests/assetTestHelper';
import { assertAudit, getAudit } from '../../audit/test/auditTestHelper';
import { OpportunityNoticeFindOptions } from '../../opportunityNotices/models/opportunityNoticeFindOptions';
import { opportunityNoticeRepository } from '../../opportunityNotices/mongo/opportunityNoticeRepository';
import { getOpportunityNotice } from '../../opportunityNotices/tests/opportunityNoticeTestHelper';
import { getOrderedProject } from '../../priorityScenarios/tests/orderedProjectTestHelper';
import { getPriorityScenario } from '../../priorityScenarios/tests/priorityScenarioTestHelper';
import { ProgramBookFindOptions } from '../../programBooks/models/programBookFindOptions';
import { programBookRepository } from '../../programBooks/mongo/programBookRepository';
import { getProgramBook } from '../../programBooks/tests/programBookTestHelper';
import { ProjectFindOptions } from '../../projects/models/projectFindOptions';
import { projectRepository } from '../../projects/mongo/projectRepository';
import { TaxonomyFindOptions } from '../../taxonomies/models/taxonomyFindOptions';
import { taxonomyRepository } from '../../taxonomies/mongo/taxonomyRepository';
import { taxonomyService } from '../../taxonomies/taxonomyService';
import { INexoImportFileProps, NexoImportFile } from '../models/nexoImportFile';
import { INexoImportLogProps, NexoImportLog } from '../models/nexoImportLog';
import { INexoLogElementProps } from '../models/nexoLogElement';
import { INexoLogInterventionProps, NexoLogIntervention } from '../models/nexoLogIntervention';
import { INexoLogProjectProps, NexoLogProject } from '../models/nexoLogProject';
import { IInterventionBudgetSEHeaders, minimalInterventionBudgetSE } from '../models/rows/interventionsBudgetSERow';
import {
  IInterventionSEHeaders,
  InterventionSERow,
  minimalInterventionSE,
  NEXO_CARNET
} from '../models/rows/interventionsSERow';
import { NEXO_CODE_STATUS_CARNET_RECEIVED, NexoImportFileValidator } from '../validators/nexoImportFileValidator';

export const NEXO_DELAY = 500; // in ms
export const EXISTING_NEXO_DOSSIER = 'EXISTING_NEXO_DOSSIER';
export const INTERVENTIONS_SE_FILE_STORAGE_ID = uuid();
export const INTERVENTIONS_BUDGET_SE_FILE_STORAGE_ID = uuid();
export const REHAB_AQ_CONCEPTION_FILE_STORAGE_ID = uuid();
export const REHAB_EG_CONCEPTION_FILE_STORAGE_ID = uuid();
const DI_NEXO_EXECUTOR_CODE = '1';

const uploadFileProps: IUploadFileProps = {
  originalname: 'fileName',
  mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  size: 10000 // in bytes
} as IUploadFileProps;

export function getUploadFile(uploadFile?: IUploadFileProps): UploadFile {
  const originalname = get(uploadFile, 'originalname') ? get(uploadFile, 'originalname') : uploadFileProps.originalname;
  return UploadFile.create({
    ...uploadFileProps,
    buffer: Buffer.from(originalname),
    ...uploadFile
  } as IUploadFileProps).getValue();
}

const nexoLogElementProps: INexoLogElementProps = {
  importStatus: NexoImportStatus.SUCCESS,
  modificationType: ModificationType.CREATION,
  errors: []
};

const nexoLogProjectProps: INexoLogProjectProps = {
  ...nexoLogElementProps
};
function getNexoLogProjectProps(props?: Partial<INexoLogProjectProps>): INexoLogProjectProps {
  return mergeProperties(nexoLogProjectProps, props);
}
export function getNexoLogProject(props?: Partial<INexoLogProjectProps>, id?: string): NexoLogProject {
  return NexoLogProject.create(getNexoLogProjectProps(props), id).getValue();
}

const nexoLogInterventionProps: INexoLogInterventionProps = {
  ...nexoLogElementProps,
  lineNumber: 100
};
function getNexoLogInterventionProps(props?: Partial<INexoLogInterventionProps>): INexoLogInterventionProps {
  return mergeProperties(nexoLogInterventionProps, props);
}
export function getNexoLogIntervention(props?: Partial<INexoLogInterventionProps>, id?: string): NexoLogIntervention {
  return NexoLogIntervention.create(getNexoLogInterventionProps(props), id).getValue();
}

const nexoImportFileProps: INexoImportFileProps = {
  name: getUploadFile().originalname,
  contentType: getUploadFile().mimetype,
  status: NexoImportStatus.SUCCESS,
  type: NexoFileType.INTERVENTIONS_SE,
  projects: [],
  interventions: [],
  storageId: uuid()
};
function getNexoImportFileProps(props?: Partial<INexoImportFileProps>): INexoImportFileProps {
  return mergeProperties(nexoImportFileProps, props);
}
export function getNexoImportFile(props?: Partial<INexoImportFileProps>, id?: string): NexoImportFile {
  return NexoImportFile.create(getNexoImportFileProps(props), id).getValue();
}

const nexoImportLogProps: INexoImportLogProps = {
  status: NexoImportStatus.SUCCESS,
  files: [getNexoImportFile()],
  audit: getAudit()
};

export function getNexoImportLogProps(props?: Partial<INexoImportLogProps>): INexoImportLogProps {
  return mergeProperties(nexoImportLogProps, props);
}

export function getNexoImportLog(props?: Partial<INexoImportLogProps>, id?: string): NexoImportLog {
  const result = NexoImportLog.create(getNexoImportLogProps(props), id);
  return result.getValue();
}

export function createXLXSFile(data: any[], filename = 'filename.xls'): any {
  const buffer = spreadsheetUtils.createXLSFile(data);
  return {
    buffer,
    encoding: '7bit',
    fieldname: 'file',
    mimetype: 'application/vnd.ms-excel',
    originalname: filename,
    size: buffer.length
  };
}

export function getInterventionSERowProps(values?: Partial<IInterventionSEHeaders>): IInterventionSEHeaders {
  return {
    ...minimalInterventionSE,
    iDActif: getFeature().properties.id,
    codeActif: '1', // egout sanitaire - assetType taxonomy,
    assets: [],
    comments: [],
    agirIntervention: undefined,
    modificationType: ModificationType.CREATION,
    ...values
  };
}

export function getInterventionSERowHeaders(values?: Partial<IInterventionSEHeaders>): IInterventionSEHeaders {
  return appUtils.capitalizeObjectKeys(getInterventionSERowProps(values));
}

export function getInterventionSERow(values?: Partial<IInterventionSEHeaders>): InterventionSERow {
  return InterventionSERow.create(getInterventionSERowProps(values)).getValue();
}

export function getInterventionBudgetSERowProps(
  values?: Partial<IInterventionBudgetSEHeaders>
): IInterventionBudgetSEHeaders {
  return {
    ...minimalInterventionBudgetSE,
    ...values
  };
}
export function getInterventionBudgetSERowHeaders(
  values?: Partial<IInterventionBudgetSEHeaders>
): IInterventionBudgetSEHeaders {
  return appUtils.capitalizeObjectKeys(getInterventionBudgetSERowProps(values));
}

export function getNexoXLXSFile(
  fileType: NexoFileType,
  inputData?: IInterventionSEHeaders[] | IInterventionBudgetSEHeaders[]
) {
  let datas: IInterventionSEHeaders[] | IInterventionBudgetSEHeaders[] = inputData;
  if (isEmpty(datas)) {
    switch (fileType) {
      case NexoFileType.INTERVENTIONS_BUDGET_SE:
        datas = [getInterventionBudgetSERowHeaders(), getInterventionBudgetSERowHeaders()];
        break;
      default:
        datas = [getInterventionSERowHeaders(), getInterventionSERowHeaders()];
    }
  }
  return createXLXSFile((datas as any[]).map(data => appUtils.capitalizeObjectKeys(data)));
}

interface INexoTestExpectedErrorByFileType {
  [key: string]: string[]; // key is a nexoFileType
}

export function assertNexoImportFailure(
  nexoImportLog: INexoImportLog,
  expectedErrors: INexoTestExpectedErrorByFileType
) {
  assert.strictEqual(nexoImportLog.status, NexoImportStatus.FAILURE);
  Object.keys(expectedErrors).forEach(fileType => {
    expectedErrors[fileType].forEach(expectedError => {
      nexoImportLog.files.find(file => file.type === fileType).errorDescription.includes(expectedError);
    });
  });
}

export function assertNexoImportLog(actual: INexoImportLog, expected: INexoImportLog) {
  const nexoImportLogsStatuses = enumValues(NexoImportStatus);
  assert.isTrue(nexoImportLogsStatuses.includes(actual.status));
  assert.strictEqual(actual.status, expected.status);
  assertNexoImportLogFiles(actual.files, expected.files);
  assertAudit(actual.audit);
}

export function assertNexoImportLogFiles(actuals: INexoImportFile[], expecteds: INexoImportFile[]) {
  const nexoImportLogsStatuses = enumValues(NexoImportStatus);
  const nexoFileTypes = enumValues(NexoFileType);

  actuals.forEach((actual, idx) => {
    assert.strictEqual(actual.id, expecteds[idx].id);
    assert.strictEqual(actual.contentType, expecteds[idx].contentType);
    assert.strictEqual(actual.name, expecteds[idx].name);
    assert.isTrue(nexoImportLogsStatuses.includes(actual.status));
    assert.strictEqual(actual.status, expecteds[idx].status);
    assert.strictEqual(actual.numberOfItems, expecteds[idx].numberOfItems);
    assert.isTrue(nexoFileTypes.includes(actual.type));
    assert.strictEqual(actual.type, expecteds[idx].type);
  });
}
// NOSONAR
export async function assertNexoImportedIntervention(
  interventionToImport: IInterventionSEHeaders,
  imported: IEnrichedIntervention
) {
  const toImport = appUtils.lowerizeObjectKeys(interventionToImport);
  // Get taxonomiesValues
  const [workType, requestor, borough] = await Promise.all(
    [
      {
        nexoCode: toImport.codeTravaux,
        group: TaxonomyGroup.workType
      },
      {
        nexoCode: toImport.uniteResponsable,
        group: TaxonomyGroup.requestor
      },
      {
        nexoCode: toImport.arrondissement,
        group: TaxonomyGroup.borough
      }
    ].map(s => NexoImportFileValidator.findTaxonomyByNexoType(s.nexoCode, s.group))
  );
  assert.strictEqual(imported.interventionTypeId, InterventionType.initialNeed);
  assert.strictEqual(imported.workTypeId, workType.code);
  assert.strictEqual(imported.requestorId, requestor.code);
  assert.strictEqual(imported.boroughId, borough.code);
  if (interventionToImport.codeStatutCarnet === NEXO_CODE_STATUS_CARNET_RECEIVED) {
    if (interventionToImport.codeExecutant === DI_NEXO_EXECUTOR_CODE) {
      assert.strictEqual(imported.status, InterventionStatus.waiting);
    } else {
      if (interventionToImport.carnet) {
        assert.strictEqual(imported.status, InterventionStatus.waiting);
      } else {
        assert.strictEqual(imported.status, InterventionStatus.integrated);
      }
    }
  } else {
    assert.strictEqual(imported.status, InterventionStatus.wished);
  }
  assert.strictEqual(imported.interventionYear, toImport.anneeDebutTravaux);
  assert.strictEqual(imported.planificationYear, toImport.anneeDebutTravaux);
  assert.strictEqual(imported.estimate.allowance, toImport.budget / 1000);
  if (!isNil(imported.programId)) {
    assert.strictEqual(imported.programId, PROGRAM_TYPE_PAR);
    assert.isTrue(imported.decisionRequired);
  } else {
    assert.isFalse(imported.decisionRequired);
  }
  assert.strictEqual(imported.contact, toImport.responsable);
  const externalReference = imported.externalReferenceIds.find(e => e);
  assert.strictEqual(externalReference.type, InterventionExternalReferenceType.nexoReferenceNumber);
  assert.strictEqual(externalReference.value, toImport.noDossierSE);
  assert.strictEqual(imported.streetName, toImport.rue);
  assert.strictEqual(imported.streetFrom, toImport.de);
  assert.strictEqual(imported.streetTo, toImport.a);
  assert.strictEqual(imported.endYear, toImport.anneeFinTravaux);
  const comments = imported.comments || [];
  for (const comment of comments) {
    assert.strictEqual(comment.text, toImport.precision);
    assert.isTrue(comment.isProjectVisible);
    assert.isFalse(comment.isPublic);
  }
  // assets ids from nexo import are null
  for (const asset of imported.assets) {
    assert.isUndefined(asset.id);
    const nexoRef = asset.externalReferenceIds.find(
      extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber
    );
    assert.isDefined(nexoRef);
    assert.strictEqual(nexoRef.value, `${toImport.comparaison}`);
    const assetId = asset.externalReferenceIds.find(
      extId => extId.type === InterventionExternalReferenceType.nexoAssetId
    );
    if (!isNil(interventionToImport.iDActif)) {
      assert.isDefined(assetId);
      assert.strictEqual(assetId.value, `${toImport.iDActif}`);
    }
  }
}

export async function assertNexoProjectCreated(importedInterventions: IEnrichedIntervention[]) {
  const findProjectsOptions = ProjectFindOptions.create({
    criterias: {}
  }).getValue();
  const allProjects = await projectRepository.findAll(findProjectsOptions);
  // check if project has been created for not di or not pni
  let projectsCreated = 0;
  for (const importedIntervention of importedInterventions) {
    if (isNil(importedIntervention.project)) {
      continue;
    }
    const foundProject = allProjects.find(project => project.id === importedIntervention.project.id);
    assert.isDefined(foundProject);
    assert.isTrue(foundProject.interventionIds.includes(importedIntervention.id));

    assert.isDefined(foundProject.geometry);
    assert.isDefined(foundProject.geometryPin);
    assert.isUndefined(foundProject.roadNetworkTypeId);
    assert.isDefined(foundProject.streetName);
    assert.isDefined(foundProject.streetFrom);
    assert.isDefined(foundProject.streetTo);
    assert.isDefined(foundProject.length);

    const projectType = await taxonomyService.translate(TaxonomyGroup.projectType, foundProject.projectTypeId);
    const expectedProjectName = `${projectType} / sur ${importedIntervention.streetName}, de ${importedIntervention.streetFrom}, à ${importedIntervention.streetTo}`;
    assert.strictEqual(foundProject.projectName, expectedProjectName);
    projectsCreated++;
  }
  // make sure at least one project have been created
  assert.isAtLeast(projectsCreated, 1);
}

export async function assertNexoProjectUpdate(
  existingProject: IEnrichedProject,
  externalId: string,
  nbInterventions?: number
) {
  // check that project have been update
  const allProjectsFind = ProjectFindOptions.create({
    criterias: {},
    expand: ProjectExpand.interventions
  }).getValue();
  const allProjects = await projectRepository.findAll(allProjectsFind);
  const projectWithNoDossier = allProjects.find(project =>
    project.externalReferenceIds.find(
      extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber && extId.value === externalId
    )
  );
  assert.isDefined(projectWithNoDossier);
  // intervention was imported and linked to project
  const intervention = projectWithNoDossier.interventions.find(i =>
    i.externalReferenceIds.find(
      extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber && extId.value === externalId
    )
  );
  assert.isDefined(intervention);
  assert.strictEqual(existingProject.id, intervention.project.id);
  assert.notEqual(projectWithNoDossier.globalBudget.allowance, existingProject.globalBudget.allowance);
  assert.notEqual(projectWithNoDossier.interventionIds, existingProject.interventionIds);
  if (nbInterventions) {
    assert.strictEqual(projectWithNoDossier.interventionIds.length, nbInterventions);
  }
}

export async function setupNexoProjectDelete(project: IEnrichedProject) {
  // create opportunity notice
  const opportunityNotice = getOpportunityNotice({
    projectId: project.id
  });
  await opportunityNoticeRepository.save(opportunityNotice);
  const existsOpportunityNotice = await opportunityNoticeRepository.findAll(
    OpportunityNoticeFindOptions.create({
      criterias: {
        projectId: project.id
      }
    }).getValue()
  );
  assert.isNotEmpty(existsOpportunityNotice);

  // create annual program to set on programBook
  const annualProgram = getAnnualProgram();

  // create programbook with removedProjectsIds
  const programBookWithRemovedProject = getProgramBook({
    removedProjects: [project],
    annualProgram
  });
  await programBookRepository.save(programBookWithRemovedProject);

  const existsProgramBookWithRemovedProject = await programBookRepository.findAll(
    ProgramBookFindOptions.create({
      criterias: {
        removedProjectsIds: project.id,
        status: enumValues(ProgramBookStatus)
      }
    }).getValue()
  );
  assert.isNotEmpty(existsProgramBookWithRemovedProject);

  // create programbook with priorityScenario and orderedproject
  const programBookWithPriorityScenario = getProgramBook({
    priorityScenarios: [
      getPriorityScenario({
        orderedProjects: [
          getOrderedProject({
            projectId: project.id
          })
        ]
      })
    ],
    annualProgram
  });
  await programBookRepository.save(programBookWithPriorityScenario);
  const existsProgramBookWithPriorityScenario = await programBookRepository.findAll(
    ProgramBookFindOptions.create({
      criterias: {
        priorityScenarioProjectsIds: project.id,
        status: enumValues(ProgramBookStatus)
      }
    }).getValue()
  );
  assert.isNotEmpty(existsProgramBookWithPriorityScenario);
}

export async function assertNexoProjectDelete(project: IEnrichedProject) {
  const projectsFound = await projectRepository.findAll(
    ProjectFindOptions.create({
      criterias: {
        id: project.id
      }
    }).getValue()
  );
  assert.isEmpty(projectsFound);

  const existsOpportunityNotice = await opportunityNoticeRepository.findAll(
    OpportunityNoticeFindOptions.create({
      criterias: {
        projectId: project.id
      }
    }).getValue()
  );
  assert.isEmpty(existsOpportunityNotice);

  const existsProgramBookWithRemovedProject = await programBookRepository.findAll(
    ProgramBookFindOptions.create({
      criterias: {
        removedProjectsIds: project.id,
        status: enumValues(ProgramBookStatus)
      }
    }).getValue()
  );
  assert.isEmpty(existsProgramBookWithRemovedProject);

  const existsProgramBookWithPriorityScenario = await programBookRepository.findAll(
    ProgramBookFindOptions.create({
      criterias: {
        priorityScenarioProjectsIds: project.id,
        status: enumValues(ProgramBookStatus)
      }
    }).getValue()
  );
  assert.isEmpty(existsProgramBookWithPriorityScenario);
}

export async function insertNexoBookTaxonomy(): Promise<ITaxonomy> {
  const nexoBookTaxos = await taxonomyRepository.findAll(
    TaxonomyFindOptions.create({
      criterias: {
        group: TaxonomyGroup.nexoBook
      }
    }).getValue()
  );
  const alreadyExists = [...nexoBookTaxos].find(taxo => taxo.code === NEXO_CARNET);
  // range exclude the last year
  const programs = range(2010, appUtils.getCurrentYear() + 20).map(year => {
    return {
      year,
      programId: PROGRAM_TYPE_PAR
    };
  });
  const nexoBookTaxonomy = {
    ...alreadyExists,
    group: TaxonomyGroup.nexoBook,
    code: NEXO_CARNET,
    label: {
      fr: `Carnet NEXO - C21aq`,
      en: `Carnet NEXO - C21aq`
    },
    properties: {
      programs: [
        {
          year: 2000,
          programId: PROGRAM_TYPE_PCPR
        },
        {
          year: 2001,
          programId: PROGRAM_TYPE_SSR
        },
        {
          year: appUtils.getCurrentYear() + 1,
          programId: PROGRAM_TYPE_PCPR
        },
        ...programs
      ]
    }
  };

  return (await taxonomyRepository.save(nexoBookTaxonomy)).getValue();
}

export async function deleteNexoBookTaxonomy(): Promise<Result<number>> {
  return taxonomyRepository.delete(
    TaxonomyFindOptions.create({
      criterias: {
        group: TaxonomyGroup.nexoBook
      }
    }).getValue()
  );
}
