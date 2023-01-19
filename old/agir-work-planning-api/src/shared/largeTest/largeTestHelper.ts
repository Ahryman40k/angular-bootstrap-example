import {
  IEnrichedAnnualProgram,
  IEnrichedIntervention,
  IEnrichedProject,
  InterventionStatus,
  IRequirement
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { Express } from 'express';
import { readFileSync } from 'fs-extra';
import httpHeaderFieldsTyped from 'http-header-fields-typed';
import { isNil } from 'lodash';
import * as path from 'path';
import * as request from 'supertest';
import { constants } from '../../../config/constants';
import { createDefaultApp } from '../../core/app';
import { annualProgramMapperDTO } from '../../features/annualPrograms/mappers/annualProgramMapperDTO';
import { AnnualProgramFindOptions } from '../../features/annualPrograms/models/annualProgramFindOptions';
import { annualProgramRepository } from '../../features/annualPrograms/mongo/annualProgramRepository';
import { InterventionFindOptions } from '../../features/interventions/models/interventionFindOptions';
import { interventionRepository } from '../../features/interventions/mongo/interventionRepository';
import { ProjectFindOptions } from '../../features/projects/models/projectFindOptions';
import { projectRepository } from '../../features/projects/mongo/projectRepository';
import { requirementMapperDTO } from '../../features/requirements/mappers/requirementMapperDTO';
import { RequirementFindOptions } from '../../features/requirements/models/requirementFindOptions';
import { requirementRepository } from '../../features/requirements/mongo/requirementRepository';
import { enumValues } from '../../utils/enumUtils';
import { appUtils, isEmpty } from '../../utils/utils';

const A_IGNORER = 'A_IGNORER';
const sortByCreatedAt = '+createdAt';

let testApp: Express;

export async function setTestApp() {
  testApp = await createDefaultApp();
}

export function readFile(fileName: string, currentFolderPath: string) {
  return JSON.parse(readFileSync(path.resolve(currentFolderPath, fileName), 'utf8'));
}

export async function doRequest(verb: string, url: string, body: any): Promise<request.Response> {
  return request(testApp)
    [verb](url)
    .set(httpHeaderFieldsTyped.ACCEPT, constants.mediaTypes.JSON)
    .set(httpHeaderFieldsTyped.ACCEPT_LANGUAGE, 'fr')
    .send(body);
}

export function assertResults<T>(importeds: T[], expecteds: T[], entityName: string) {
  const [flattenedImporteds, flattenedExpecteds] = [importeds, expecteds].map(o => appUtils.flattenObject(o));

  Object.keys(flattenedExpecteds).forEach(key => {
    if (flattenedExpecteds[key] === A_IGNORER) {
      return;
    }
    assert.strictEqual(
      flattenedImporteds[key],
      flattenedExpecteds[key],
      `should be equal for object ${entityName} and key ${key}`
    );
  });

  Object.keys(flattenedImporteds)
    .filter(key => isNil(Object.keys(flattenedExpecteds).find(item => item === key)))
    .forEach(key => {
      const items = key.split('.');
      let isIgnored = false;
      let s = items[0];
      for (let i = 1; i < items.length; i++) {
        s += '.' + items[i];
        if (flattenedExpecteds[s] === A_IGNORER) {
          isIgnored = true;
          break;
        }
      }
      if (flattenedExpecteds[key] === A_IGNORER || isIgnored) {
        return;
      }
      assert.strictEqual(
        flattenedImporteds[key],
        flattenedExpecteds[key],
        `should be equal for object ${entityName} and key ${key}`
      );
    });
}

export async function assertInterventions(expectedInterventionResults: IEnrichedIntervention[]) {
  const findInterventionsOptions = InterventionFindOptions.create({
    criterias: {
      status: enumValues<InterventionStatus>(InterventionStatus)
    }
  }).getValue();
  const interventions = await interventionRepository.findAll(findInterventionsOptions);
  if (!isEmpty(expectedInterventionResults)) {
    assert.equal(
      interventions.length,
      expectedInterventionResults.length,
      'The number of interventions is not the one expected.'
    );
    assertResults<IEnrichedIntervention>(interventions, expectedInterventionResults, 'Intervention');
  } else {
    assert.isEmpty(interventions);
  }
}

export async function assertProjects(expectedProjectsResults: IEnrichedProject[]) {
  const findProjectsOptions = ProjectFindOptions.create({
    criterias: {},
    orderBy: sortByCreatedAt
  }).getValue();
  const projects = await projectRepository.findAll(findProjectsOptions);
  if (!isEmpty(expectedProjectsResults)) {
    assert.equal(projects.length, expectedProjectsResults.length, 'The number of projects is not the one expected.');
    assertResults<IEnrichedProject>(projects, expectedProjectsResults, 'Project');
  } else {
    assert.isEmpty(projects);
  }
}

export async function assertRequirements(expectedRequirementResults: IRequirement[]) {
  const findRequirementsOptions = RequirementFindOptions.create({
    criterias: {},
    orderBy: sortByCreatedAt
  }).getValue();
  const requirements = await requirementMapperDTO.getFromModels(
    await requirementRepository.findAll(findRequirementsOptions)
  );
  if (!isEmpty(expectedRequirementResults)) {
    assert.equal(
      requirements.length,
      expectedRequirementResults.length,
      'The number of requirements is not the one expected.'
    );
    assertResults<IRequirement>(requirements, expectedRequirementResults, 'Requirement');
  } else {
    assert.isEmpty(requirements);
  }
}

export async function assertAnnualPrograms(expectedAnnualProgramResults: IEnrichedAnnualProgram[]) {
  const findAnnualProgramOptions = AnnualProgramFindOptions.create({
    criterias: {},
    orderBy: sortByCreatedAt
  }).getValue();
  const annualPrograms = await annualProgramMapperDTO.getFromModels(
    await annualProgramRepository.findAll(findAnnualProgramOptions)
  );
  if (!isEmpty(expectedAnnualProgramResults)) {
    assert.equal(
      annualPrograms.length,
      expectedAnnualProgramResults.length,
      'The number of annual programs is not the one expected.'
    );
    assertResults<IEnrichedAnnualProgram>(annualPrograms, expectedAnnualProgramResults, 'AnnualProgram');
  } else {
    assert.isEmpty(annualPrograms);
  }
}
