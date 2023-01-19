import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { cloneDeep, get, isArray, mergeWith, set } from 'lodash';

import { db } from '../../src/features/database/DB';
import { ITaxonomyCriterias, TaxonomyFindOptions } from '../../src/features/taxonomies/models/taxonomyFindOptions';
import { taxonomyRepository } from '../../src/features/taxonomies/mongo/taxonomyRepository';
import { resetTestingModeSequence } from '../../src/middlewares/alphaNumericIdIncPlugin';
import { IBaseRepository } from '../../src/repositories/core/baseRepository';
import { IGuardResult } from '../../src/shared/logic/guard';
import { ITransition } from '../../src/shared/stateMachine/transition';
import { appUtils } from '../../src/utils/utils';

export const INVALID_ASSET = 'InvalidAsset';
export const INVALID_MAX_ITERATIONS = 'InvalidMaxIterations';
export const INVALID_PROJECT_ID = 'InvalidProjectId';
export const INVALID_REQUESTOR_ID = 'InvalidRequestorId';
export const INVALID_FOLLOW_UP_METHOD = 'InvalidFollowUpMethod';
export const NOT_FOUND_PROJECT_ID = 'P73737';
export const NOT_FOUND_INTERVENTION_ID = 'I99999';
export const NOT_FOUND_UUID = '5fa0295166820e0010bc02fd';
export const INVALID_UUID = 'InvalidUuid';
export const INVALID_TYPE = 'InvalidType';
export const VALID_UUID = '5fa0295166820e0010bc02fd';

export async function destroyDBTests() {
  await db()
    .models.Project.deleteMany({})
    .exec();
  await db()
    .models.Intervention.deleteMany({})
    .exec();
  await db()
    .models.AnnualProgram.deleteMany({})
    .exec();
  await db()
    .models.History.deleteMany({})
    .exec();
  await db()
    .models.Counters.deleteMany({ key: { $nin: ['drm'] } })
    .exec();
  await db()
    .models.Counters.findOneAndUpdate({ key: 'drm' }, { sequence: 4999, availableValues: [], __v: 0 })
    .exec();
  await db()
    .models.ProgramBook.deleteMany({})
    .exec();
  await db()
    .models.OpportunityNotice.deleteMany({})
    .exec();
  await db()
    .models.BicImportLog.deleteMany({})
    .exec();
  await db()
    .models.NexoImportLog.deleteMany({})
    .exec();
  await db()
    .models.RtuImportLog.deleteMany({})
    .exec();
  await db()
    .models.RtuProject.deleteMany({})
    .exec();
  await db()
    .models.RtuExportLog.deleteMany({})
    .exec();
  await db()
    .models.Requirement.deleteMany({})
    .exec();
  await db()
    .models.Submission.deleteMany({})
    .exec();
  resetTestingModeSequence();
}

export async function createMany(objs: any[], repository: IBaseRepository<any, any>) {
  const createdObjs = (await Promise.all(objs.map(obj => repository.save(obj)))).map(result => result.getValue());
  return createdObjs;
}

// FUlly merge even undefined to test
export function mergeProperties(current: any, incoming: any) {
  const merged = mergeWith(cloneDeep(current), incoming, (objValue, srcValue, key) => {
    if (isArray(objValue)) {
      return srcValue;
    }
  });
  const flattened = appUtils.flattenObject(incoming);
  Object.keys(flattened).forEach(key => {
    set(merged, key, get(incoming, key));
  });
  return merged;
}

// Remove all undefined fields as going through a request/response
export function removeEmpty(obj: any) {
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined) {
      delete obj[key];
      continue;
    }
    if (obj[key] && typeof obj[key] === 'object') {
      removeEmpty(obj[key]);
      if (!Array.isArray(obj[key]) && !Object.keys(obj[key]).length) {
        delete obj[key];
      }
    }
  }
  return obj;
}

export function assertFailure(actual: any[], expected: any) {
  assertFailures(actual, [expected]);
}

export function assertFailures(actual: any[], expected: any[]) {
  const actualFailures = Array.isArray(actual) ? actual : [actual];
  expected.forEach(expectedFailure => {
    const found = actualFailures.find(
      actualFailure => actualFailure.code === expectedFailure.code && actualFailure.target === expectedFailure.target
    );
    assert.isDefined(found);
    assertGuardResult(found, expectedFailure);
  });
}

function assertGuardResult(actual: IGuardResult, expected: IGuardResult) {
  assert.strictEqual(actual.succeeded, expected.succeeded);
  assert.strictEqual(actual.code, expected.code);
  assert.strictEqual(actual.message, expected.message);
  assert.strictEqual(actual.target, expected.target);
}

/*
 * Add given number of years in parameters to current year
 */
export function getFutureYear(years: number = 1) {
  return appUtils.getCurrentYear() + years;
}

export function getPastYear(years: number = 1) {
  return appUtils.getCurrentYear() - years;
}

export function getHistoryObjectKeys(): string[] {
  return ['_id', 'objectTypeId', 'referenceId', 'actionId', 'summary', 'audit'];
}

export function getAllTransitionsBetweenStatuses(statuses: string[]): ITransition<any, any, any>[] {
  const transitions: ITransition<any, any, any>[] = [];
  statuses.forEach(status1 => {
    statuses.forEach(status2 => {
      if (status1 !== status2) {
        transitions.push({
          from: `${status1}`,
          to: `${status2}`,
          run: undefined
        });
      }
    });
  });
  return transitions;
}

export function getAllForbiddenTransitionsBetweenStatuses(
  statuses: string[],
  validTransitions: ITransition<any, any, any>[]
): ITransition<any, any, any>[] {
  const allTransitions: ITransition<any, any, any>[] = getAllTransitionsBetweenStatuses(statuses);
  return allTransitions.filter(
    transition => !validTransitions.find(valid => valid.from === transition.from && valid.to === transition.to)
  );
}

export async function getTaxonomyByCriterias(criterias: ITaxonomyCriterias): Promise<ITaxonomy[]> {
  return taxonomyRepository.findAll(
    TaxonomyFindOptions.create({
      criterias
    }).getValue()
  );
}
