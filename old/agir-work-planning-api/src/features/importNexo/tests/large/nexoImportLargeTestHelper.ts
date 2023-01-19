import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import {
  AssetType,
  BoroughCode,
  CommentCategory,
  IComment,
  IEnrichedIntervention,
  IEnrichedProgramBook,
  IEnrichedProject,
  IInterventionDecision,
  INexoImportLog,
  InterventionDecisionType,
  InterventionStatus,
  InterventionType,
  IPlainComment,
  IPlainDocument,
  ISubmission,
  NexoImportStatus,
  ProgramBookStatus,
  ProjectType,
  RequirementTargetType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { SinonSandbox } from 'sinon';

import { constants, EndpointTypes } from '../../../../../config/constants';
import { assertResults, doRequest } from '../../../../shared/largeTest/largeTestHelper';
import { Result } from '../../../../shared/logic/result';
import { storageApiService } from '../../../../shared/storage/storageApiService';
import { REQUESTOR_DRE, WORK_TYPE_CONSTRUCTION } from '../../../../shared/taxonomies/constants';
import { appUtils, isEmpty } from '../../../../utils/utils';
import { AnnualProgramFindOptions } from '../../../annualPrograms/models/annualProgramFindOptions';
import { annualProgramRepository } from '../../../annualPrograms/mongo/annualProgramRepository';
import { documentsTestHelper, getInputPlainDocument } from '../../../documents/tests/documentsTestHelper';
import { InterventionFindOptions } from '../../../interventions/models/interventionFindOptions';
import { interventionRepository } from '../../../interventions/mongo/interventionRepository';
import { programBookMapperDTO } from '../../../programBooks/mappers/programBookMapperDTO';
import { ProgramBook } from '../../../programBooks/models/programBook';
import { ProgramBookFindOptions } from '../../../programBooks/models/programBookFindOptions';
import { programBookRepository } from '../../../programBooks/mongo/programBookRepository';
import { submissionMapperDTO } from '../../../submissions/mappers/submissionMapperDTO';
import { SubmissionFindOptions } from '../../../submissions/models/submissionFindOptions';
import { submissionRepository } from '../../../submissions/mongo/submissionRepository';
import { nexoImportLogMapperDTO } from '../../mappers/nexoImportLogMapperDTO';
import { nexoImportLogRepository } from '../../mongo/nexoImportLogRepository';
import {
  INTERVENTIONS_BUDGET_SE_FILE_STORAGE_ID,
  INTERVENTIONS_SE_FILE_STORAGE_ID,
  REHAB_AQ_CONCEPTION_FILE_STORAGE_ID,
  REHAB_EG_CONCEPTION_FILE_STORAGE_ID
} from '../nexoTestHelper';

export enum InterventionAction {
  ACCEPT,
  REFUSE,
  CANCEL,
  ADD_COMMENT,
  ADD_DOCUMENT,
  ADD_REQUIREMENT,
  CREATE_PROJECT,
  CREATE_INTEGRATED_PROJECT,
  UPDATE_ANNUAL_DISTRIBUTION
}

export enum ProjectAction {
  ADD_COMMENT,
  ADD_DOCUMENT,
  ADD_REQUIREMENT,
  ADD_INTERVENTION,
  UPDATE_ANNUAL_DISTRIBUTION,
  ADD_PROJECT_TO_PROGRAM_BOOK,
  CREATE_SUBMISSION
}

export interface ILargeTestScenario {
  folders: string[];
  expectedResults?: NexoImportStatus[];
  interventionActions?: InterventionAction[][];
  projectActions?: ProjectAction[][];
}

export type DocumentType = 'project' | 'intervention';

const [
  interventionApiUrl,
  requirementApiUrl,
  projectApiUrl,
  annualProgramApiUrl,
  programBookApiUrl,
  submissionApiUrl
] = [
  constants.locationPaths.INTERVENTION,
  constants.locationPaths.REQUIREMENTS,
  constants.locationPaths.PROJECT,
  constants.locationPaths.ANNUAL_PROGRAM,
  constants.locationPaths.PROGRAM_BOOK,
  constants.locationPaths.SUBMISSIONS
].map(location => appUtils.createPublicFullPath(location, EndpointTypes.API));

const sortByCreatedAt = '+createdAt';

export function stubDownload(
  sandbox: SinonSandbox,
  currentFolderPath: string,
  interventionFilePath: any,
  budgetFilePath: any,
  rehabAqConceptionFilePath: any,
  rehabEgConceptionFilePath: any,
  success = true
) {
  const method = 'get';
  if (!success) {
    sandbox.stub(storageApiService, method).rejects();
  }
  const stub = sandbox.stub(storageApiService, method);
  stub.withArgs(INTERVENTIONS_SE_FILE_STORAGE_ID).resolves(
    Result.ok({
      metadata: {
        objectName: interventionFilePath.replace(/^.*[\\\/]/, ''),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      data: appUtils.readFile(currentFolderPath, interventionFilePath)
    }) as any
  );
  if (!isEmpty(budgetFilePath)) {
    stub.withArgs(INTERVENTIONS_BUDGET_SE_FILE_STORAGE_ID).resolves(
      Result.ok({
        metadata: {
          objectName: budgetFilePath.replace(/^.*[\\\/]/, ''),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        data: appUtils.readFile(currentFolderPath, budgetFilePath)
      }) as any
    );
  }
  if (!isEmpty(rehabAqConceptionFilePath)) {
    stub.withArgs(REHAB_AQ_CONCEPTION_FILE_STORAGE_ID).resolves(
      Result.ok({
        metadata: {
          objectName: rehabAqConceptionFilePath.replace(/^.*[\\\/]/, ''),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        data: appUtils.readFile(currentFolderPath, rehabAqConceptionFilePath)
      }) as any
    );
  }
  if (!isEmpty(rehabEgConceptionFilePath)) {
    stub.withArgs(REHAB_EG_CONCEPTION_FILE_STORAGE_ID).resolves(
      Result.ok({
        metadata: {
          objectName: rehabEgConceptionFilePath.replace(/^.*[\\\/]/, ''),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        data: appUtils.readFile(currentFolderPath, rehabEgConceptionFilePath)
      }) as any
    );
  }
}

export async function assertProgramBooks(expectedProgramBookResults: IEnrichedProgramBook[]) {
  const findProgramBookOptions = ProgramBookFindOptions.create({
    criterias: {},
    orderBy: sortByCreatedAt
  }).getValue();
  const programBooks = await programBookMapperDTO.getFromModels(
    await programBookRepository.findAll(findProgramBookOptions)
  );
  if (!isEmpty(expectedProgramBookResults)) {
    assert.equal(
      programBooks.length,
      expectedProgramBookResults.length,
      'The number of program books is not the one expected.'
    );
    assertResults<IEnrichedProgramBook>(programBooks, expectedProgramBookResults, 'ProgramBook');
  } else {
    assert.isEmpty(programBooks);
  }
}

export async function assertSubmissions(expectedSubmissionResults: ISubmission[]) {
  const findSubmissionOptions = SubmissionFindOptions.create({
    criterias: {},
    orderBy: sortByCreatedAt
  }).getValue();
  const submissions = await submissionMapperDTO.getFromModels(
    await submissionRepository.findAll(findSubmissionOptions)
  );
  if (!isEmpty(expectedSubmissionResults)) {
    assert.equal(
      submissions.length,
      expectedSubmissionResults.length,
      'The number of submissions is not the one expected.'
    );
    assertResults<ISubmission>(submissions, expectedSubmissionResults, 'Submission');
  } else {
    assert.isEmpty(submissions);
  }
}

export async function getNexoImportLogFromDB(id: string): Promise<INexoImportLog> {
  return nexoImportLogMapperDTO.getFromModel(await nexoImportLogRepository.findById(id));
}

export async function doInterventionActions(
  interventionActions: InterventionAction[],
  interventions: IEnrichedIntervention[]
) {
  for (const action of interventionActions) {
    switch (action) {
      case InterventionAction.ACCEPT:
        await acceptInterventions(interventions);
        break;
      case InterventionAction.REFUSE:
        await refuseInterventions(interventions);
        break;
      case InterventionAction.CANCEL:
        await cancelInterventions(interventions);
        break;
      case InterventionAction.ADD_COMMENT:
        await addCommentToInterventions(interventions);
        break;
      case InterventionAction.ADD_DOCUMENT:
        await addDocumentToInterventions(interventions);
        break;
      case InterventionAction.ADD_REQUIREMENT:
        await addRequirementToInterventions(interventions);
        break;
      case InterventionAction.CREATE_PROJECT:
        await createProjectForInterventions(interventions);
        break;
      case InterventionAction.CREATE_INTEGRATED_PROJECT:
        await createProjectForInterventions(interventions, ProjectType.integrated);
        break;
      case InterventionAction.UPDATE_ANNUAL_DISTRIBUTION:
        await updateInterventionAnnualDistribution(interventions);
        break;
      default:
        throw new Error('Unsupported action :' + action);
    }
  }
}

export async function doProjectActions(projectActions: ProjectAction[], projects: IEnrichedProject[]) {
  for (const action of projectActions) {
    switch (action) {
      case ProjectAction.ADD_COMMENT:
        await addCommentToProjects(projects);
        break;
      case ProjectAction.ADD_DOCUMENT:
        await addDocumentToProjects(projects);
        break;
      case ProjectAction.ADD_REQUIREMENT:
        await addRequirementToProjects(projects);
        break;
      case ProjectAction.ADD_INTERVENTION:
        await addIntervention(projects);
        break;
      case ProjectAction.UPDATE_ANNUAL_DISTRIBUTION:
        await updateProjectAnnualDistribution(projects);
        break;
      case ProjectAction.ADD_PROJECT_TO_PROGRAM_BOOK:
        await addProjectsToProgramBook(projects);
        break;
      case ProjectAction.CREATE_SUBMISSION:
        await createSubmissionForProjects(projects);
        break;
      default:
        throw new Error('Unsupported action :' + action);
    }
  }
}

async function acceptInterventions(interventions: IEnrichedIntervention[]) {
  for (const intervention of interventions) {
    const decision: IInterventionDecision = {
      typeId: InterventionDecisionType.accepted,
      text: 'Accepté (Go)',
      targetYear: intervention.planificationYear
    };

    const response = await doRequest('post', `${interventionApiUrl}/${intervention.id}/decisions`, decision);

    assert.equal(response.status, 201, 'Unable to accept one intervention.');
  }
}

async function refuseInterventions(interventions: IEnrichedIntervention[]) {
  for (const intervention of interventions) {
    const decision: IInterventionDecision = {
      typeId: InterventionDecisionType.refused,
      refusalReasonId: 'mobility',
      text: 'This is a justification.'
    };

    const response = await doRequest('post', `${interventionApiUrl}/${intervention.id}/decisions`, decision);

    assert.equal(response.status, 201, 'Unable to refuse one intervention.');
  }
}

async function cancelInterventions(interventions: IEnrichedIntervention[]) {
  for (const intervention of interventions) {
    const decision: IInterventionDecision = {
      typeId: InterventionDecisionType.canceled,
      text: 'This is a justification.'
    };

    const response = await doRequest('post', `${interventionApiUrl}/${intervention.id}/decisions`, decision);

    assert.equal(response.status, 201, 'Unable to cancel one intervention.');
  }
}

async function addCommentToInterventions(interventions: IEnrichedIntervention[]) {
  for (const intervention of interventions) {
    await addComment(interventionApiUrl, intervention.id, 'intervention', {
      isProjectVisible: false
    });
  }
}

async function addCommentToProjects(projects: IEnrichedProject[]) {
  for (const project of projects) {
    await addComment(projectApiUrl, project.id, 'project');
  }
}

async function addComment(
  basedUrl: string,
  documentId: string,
  documentType: string,
  commentProps?: Partial<IComment>
) {
  const comment: IPlainComment = {
    categoryId: CommentCategory.information,
    text: 'This is the comment content.',
    isPublic: true,
    ...commentProps
  };

  const response = await doRequest('post', `${basedUrl}/${documentId}/comments`, comment);

  assert.equal(response.status, 201, `Unable to create a comment for one ${documentType}.`);
}

async function addDocumentToInterventions(interventions: IEnrichedIntervention[]) {
  for (const intervention of interventions) {
    await addDocument(
      interventionApiUrl,
      intervention.id,
      'intervention',
      getInputPlainDocument({
        documentName: 'interventionDocument',
        isProjectVisible: true
      })
    );
  }
}

async function addDocumentToProjects(projects: IEnrichedProject[]) {
  for (const project of projects) {
    await addDocument(
      projectApiUrl,
      project.id,
      'project',
      getInputPlainDocument({
        documentName: 'projectDocument'
      })
    );
  }
}

async function addDocument(basedUrl: string, entityId: string, documentType: DocumentType, document: IPlainDocument) {
  const response = await documentsTestHelper.uploadDocumentWithAttachment(
    'post',
    `${basedUrl}/${entityId}/documents`,
    document
  );
  assert.equal(response.status, 201, `Unable to create a document for one ${documentType}.`);
}

async function addRequirementToInterventions(interventions: IEnrichedIntervention[]) {
  for (const intervention of interventions) {
    await addRequirementTo(intervention.id, RequirementTargetType.intervention);
  }
}

async function addRequirementToProjects(projects: IEnrichedProject[]) {
  for (const project of projects) {
    await addRequirementTo(project.id, RequirementTargetType.project);
  }
}

async function addRequirementTo(itemId: string, itemType: RequirementTargetType) {
  const requirement = {
    typeId: 'other',
    subtypeId: 'otherRequirements',
    text: 'This is the requirement content.',
    items: [
      {
        id: itemId,
        type: itemType
      }
    ]
  };

  const response = await doRequest('post', `${requirementApiUrl}`, requirement);

  assert.equal(response.status, 201, `Unable to create a requirement for one ${itemType}.`);
}

async function createProjectForInterventions(interventions: IEnrichedIntervention[], projectType?: ProjectType) {
  for (const intervention of interventions) {
    const project = {
      projectTypeId: projectType
        ? projectType
        : intervention.programId
        ? ProjectType.nonIntegrated
        : ProjectType.integrated,
      projectName: 'This is the project name.',
      boroughId: intervention.boroughId,
      executorId: intervention.executorId,
      startYear: intervention.planificationYear,
      endYear: intervention.endYear,
      streetName: 'This is the street name.',
      geometry: intervention.interventionArea.geometry,
      interventionIds: [intervention.id],
      globalBudget: {
        allowance: intervention.estimate.allowance
      },
      inChargeId: intervention.requestorId
    };

    const response = await doRequest('post', `${projectApiUrl}`, project);

    assert.equal(response.status, 201, 'Unable to create a project for one intervention.');
  }
}

async function updateInterventionAnnualDistribution(interventions: IEnrichedIntervention[]) {
  for (const intervention of interventions) {
    const annualDistribution = {
      annualPeriods: intervention.annualDistribution.annualPeriods.map(period => {
        return {
          annualAllowance: period.annualAllowance,
          annualLength: period.annualLength,
          accountId: 123456,
          year: period.year,
          rank: period.rank
        };
      }),
      distributionSummary: {
        note: 'This is the note content.'
      }
    };

    const response = await doRequest(
      'put',
      `${interventionApiUrl}/${intervention.id}/annualDistribution`,
      annualDistribution
    );

    assert.equal(response.status, HttpStatusCodes.OK, 'Unable to update the annual distribution for one intervention.');
  }
}

async function addIntervention(projects: IEnrichedProject[]) {
  for (const project of projects) {
    await createIntervention(project);

    const findLatestInterventionOptions = InterventionFindOptions.create({
      criterias: {},
      orderBy: '-createdAt'
    }).getValue();
    const intervention = await interventionRepository.findOne(findLatestInterventionOptions);

    project.interventionIds.push(intervention.id);

    const requestBody = {
      projectTypeId: project.projectTypeId,
      projectName: project.projectName,
      boroughId: project.boroughId,
      executorId: project.executorId,
      startYear: project.startYear,
      endYear: project.endYear,
      streetName: project.streetName,
      geometry: project.geometry,
      interventionIds: project.interventionIds,
      servicePriorities: project.servicePriorities,
      globalBudget: {
        allowance: project.globalBudget.allowance + intervention.estimate.allowance
      },
      inChargeId: project.inChargeId
    };

    const response = await doRequest('put', `${projectApiUrl}/${project.id}`, requestBody);

    assert.equal(response.status, HttpStatusCodes.OK, 'Unable to add an intervention to a project.');
  }
}

async function createIntervention(project: IEnrichedProject) {
  const intervention = {
    assets: [
      {
        typeId: AssetType.aqueductSegment,
        ownerId: REQUESTOR_DRE,
        geometry: project.geometry
      }
    ],
    boroughId: project.boroughId,
    estimate: 42,
    interventionArea: {
      geometry: project.geometry
    },
    interventionName: 'This is the intervention name.',
    interventionTypeId: InterventionType.initialNeed,
    interventionYear: project.startYear,
    planificationYear: project.startYear,
    requestorId: REQUESTOR_DRE,
    executorId: project.executorId,
    workTypeId: WORK_TYPE_CONSTRUCTION,
    contact: 'This is the contact.',
    status: InterventionStatus.waiting
  };

  const response = await doRequest('post', `${interventionApiUrl}`, intervention);

  assert.equal(response.status, 201, 'Unable to create an intervention.');
}

async function updateProjectAnnualDistribution(projects: IEnrichedProject[]) {
  for (const project of projects) {
    const annualDistribution = {
      annualPeriods: project.annualDistribution.annualPeriods.map(period => {
        return {
          year: period.year,
          additionalCosts: [
            {
              type: 'contingency',
              amount: 10,
              accountId: 123456
            },
            {
              type: 'others',
              amount: 20,
              accountId: 654321
            },
            {
              type: 'professionalServices',
              amount: 30,
              accountId: 456789
            },
            {
              type: 'workExpenditures',
              amount: 40,
              accountId: 987654
            }
          ]
        };
      }),
      annualProjectDistributionSummary: {
        additionalCostsNotes: [
          {
            type: 'contingency',
            note: 'This is the contingency note content.'
          },
          {
            type: 'others',
            note: 'This is the others note content.'
          },
          {
            type: 'professionalServices',
            note: 'This is the professionalServices note content.'
          },
          {
            type: 'workExpenditures',
            note: 'This is the workExpenditures note content.'
          }
        ]
      }
    };

    const response = await doRequest('put', `${projectApiUrl}/${project.id}/annualDistribution`, annualDistribution);

    assert.equal(response.status, HttpStatusCodes.OK, 'Unable to update the annual distribution for one project.');
  }
}

async function addProjectsToProgramBook(projects: IEnrichedProject[]) {
  if (isEmpty(projects)) {
    return;
  }

  await createAnnualProgram(projects[0].executorId, projects[0].startYear);

  const findAnnualProgramOptions = AnnualProgramFindOptions.create({
    criterias: {},
    orderBy: sortByCreatedAt
  }).getValue();
  const annualPrograms = await annualProgramRepository.findAll(findAnnualProgramOptions);

  await createProgramBook(annualPrograms[0].id, projects[0].projectTypeId as ProjectType);

  const findProgramBookOptions = ProgramBookFindOptions.create({
    criterias: {},
    orderBy: sortByCreatedAt
  }).getValue();
  const programBooks = await programBookRepository.findAll(findProgramBookOptions);

  await openProgramBook(programBooks[0]);

  for (const project of projects) {
    const requestBody = {
      projectId: project.id,
      annualPeriodYear: project.startYear
    };

    const response = await doRequest('post', `${programBookApiUrl}/${programBooks[0].id}/projects`, requestBody);

    assert.equal(response.status, HttpStatusCodes.OK, `Unable to open a program book.`);
  }
}

async function createAnnualProgram(executorId: string, year: number) {
  const annualProgram = {
    executorId,
    year,
    budgetCap: 1000,
    description: 'This is the description content.'
  };

  const response = await doRequest('post', `${annualProgramApiUrl}`, annualProgram);

  assert.equal(response.status, 201, `Unable to create an annual program.`);
}

async function createProgramBook(annualProgramId: string, projectType: ProjectType) {
  const programBook = {
    name: 'This is the program book name.',
    inCharge: 'This is the guy in charge.',
    projectTypes: [projectType],
    programTypes: projectType === ProjectType.nonIntegrated ? ['par'] : [],
    boroughIds: [BoroughCode.MTL],
    description: 'This is the description content.'
  };

  const response = await doRequest('post', `${annualProgramApiUrl}/${annualProgramId}/programBooks`, programBook);

  assert.equal(response.status, 201, `Unable to create a program book.`);
}

async function openProgramBook(programBook: ProgramBook) {
  const requestBody = {
    name: programBook.name,
    projectTypes: programBook.projectTypes,
    programTypes: programBook.programTypes,
    boroughIds: programBook.boroughIds,
    inCharge: programBook.inCharge,
    sharedRoles: programBook.sharedRoles,
    status: ProgramBookStatus.programming
  };

  const response = await doRequest('put', `${programBookApiUrl}/${programBook.id}`, requestBody);

  assert.equal(response.status, HttpStatusCodes.OK, `Unable to open a program book.`);
}

async function shareProgramBook(programBook: ProgramBook, status: ProgramBookStatus) {
  const requestBody = {
    name: programBook.name,
    projectTypes: programBook.projectTypes,
    programTypes: programBook.programTypes,
    boroughIds: programBook.boroughIds,
    inCharge: programBook.inCharge,
    sharedRoles: ['EXECUTOR', 'INTERNAL-GUEST-STANDARD', 'INTERNAL-GUEST-RESTRICTED'],
    status
  };

  const response = await doRequest('put', `${programBookApiUrl}/${programBook.id}`, requestBody);

  assert.equal(response.status, HttpStatusCodes.OK, `Unable to share a program book.`);
}

async function generateDRM(projects: IEnrichedProject[]) {
  const requestBody = {
    projectIds: projects.map(item => item.id),
    isCommonDrmNumber: true
  };

  const response = await doRequest('post', `${projectApiUrl}/generateDrmNumber`, requestBody);

  assert.equal(response.status, HttpStatusCodes.OK, `Unable to generate a DRM.`);
}

async function createSubmissionForProjects(projects: IEnrichedProject[]) {
  await generateDRM(projects);

  const findProgramBookOptions = ProgramBookFindOptions.create({
    criterias: {},
    orderBy: sortByCreatedAt
  }).getValue();
  const programBooks = await programBookRepository.findAll(findProgramBookOptions);

  await shareProgramBook(programBooks[0], ProgramBookStatus.submittedPreliminary);
  await shareProgramBook(programBooks[0], ProgramBookStatus.submittedFinal);

  const requestBody = {
    programBookId: programBooks[0].id,
    projectIds: projects.map(item => item.id)
  };

  const response = await doRequest('post', `${submissionApiUrl}`, requestBody);

  assert.equal(response.status, 201, `Unable to create a submission.`);
}
