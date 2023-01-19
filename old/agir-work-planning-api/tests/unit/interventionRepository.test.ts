import { IEnrichedIntervention, InterventionType, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import { after } from 'mocha';
import { Aggregate } from 'mongoose';

import { constants } from '../../config/constants';
import { db } from '../../src/features/database/DB';
import { interventionMatchBuilder } from '../../src/features/interventions/interventionMatchBuilder';
import {
  IInterventionCriterias,
  InterventionFindOptions
} from '../../src/features/interventions/models/interventionFindOptions';
import { interventionRepository } from '../../src/features/interventions/mongo/interventionRepository';
import { IFindOptionsProps } from '../../src/shared/findOptions/findOptions';
import { createLogger } from '../../src/utils/logger';
import { integrationAfter } from '../integration/_init.test';

// Disabling the "function length" rule is OK for the test files.
// tslint:disable:max-func-body-length

const logger = createLogger('InterventionRepositoryTest');

describe('Intervention repository', () => {
  after(async () => {
    await integrationAfter();
  });

  describe('Tests getFilterFromQueryParams', () => {
    function getFindOptions(criterias: IInterventionCriterias): InterventionFindOptions {
      return InterventionFindOptions.create({
        criterias,
        offset: constants.PaginationDefaults.OFFSET,
        limit: constants.PaginationDefaults.LIMIT
      }).getValue();
    }

    const defaultStatuses = InterventionFindOptions.getDefaultStatuses();
    const getDefaultQueryStatuses = [
      { status: { $in: defaultStatuses } },
      { status: { $exists: false } },
      { status: null }
    ];

    it('C31687	Positive - Queries are formated to be a mongo match parameter', async () => {
      const findOptions = getFindOptions({ planificationYear: 2021, assetTypeId: 'FA' });
      const filter = await interventionMatchBuilder.getMatchFromQueryParams(findOptions.criterias);

      assert.deepEqual(filter, {
        $and: [
          {
            planificationYear: { $in: [2021] }
          },
          { 'assets.typeId': { $in: ['FA'] } },
          { $or: getDefaultQueryStatuses }
        ]
      });
    });
    it('C31688	Positive - If "from" or "to" and a strict equal is also specified, only equal will be considerated', async () => {
      const findOptions = getFindOptions({
        interventionYear: 2021,
        fromInterventionYear: 2019,
        toInterventionYear: 2022,
        planificationYear: 2021,
        assetTypeId: 'FA'
      });
      const filter = await interventionMatchBuilder.getMatchFromQueryParams(findOptions.criterias);
      assert.deepEqual(filter, {
        $and: [
          { interventionYear: { $in: [2021] } },
          {
            planificationYear: { $in: [2021] }
          },
          { 'assets.typeId': { $in: ['FA'] } },
          { $or: getDefaultQueryStatuses }
        ]
      });
    });
    it('C31689 - Positive - if "from" or "to" are specified for a parameter, that parameter will contain $lte or $gte', async () => {
      const findOptions = getFindOptions({
        fromInterventionYear: 2019,
        toInterventionYear: 2022,
        fromPlanificationYear: 2020,
        assetTypeId: 'FA'
      });
      const filter = await interventionMatchBuilder.getMatchFromQueryParams(findOptions.criterias);
      logger.debug(filter);
      assert.deepEqual(filter, {
        $and: [
          {
            interventionYear: {
              $gte: 2019
            }
          },
          {
            interventionYear: {
              $lte: 2022
            }
          },
          {
            planificationYear: { $gte: 2020 }
          },
          { 'assets.typeId': { $in: ['FA'] } },
          { $or: getDefaultQueryStatuses }
        ]
      });
    });
    it('C53948 - Positive - Should return only interventions with canceled status when given status filter', async () => {
      const findOptions = getFindOptions({
        status: 'canceled'
      });
      const filter = await interventionMatchBuilder.getMatchFromQueryParams(findOptions.criterias);
      logger.debug(filter);
      assert.deepEqual(filter, {
        $and: [
          {
            status: {
              $in: ['canceled']
            }
          }
        ]
      });
    });
    it('C31690	Positive - Received empty query, returns empty filter object', async () => {
      const findOptions = getFindOptions({});
      const filter = await interventionMatchBuilder.getMatchFromQueryParams(findOptions.criterias);
      assert.deepEqual(filter, {
        $and: [
          {
            $or: getDefaultQueryStatuses
          }
        ]
      });
    });
    it('C32601	Positive - Query isInital received, query value is transformed to boolean and match option is returned', async () => {
      const findOptions = getFindOptions({
        interventionTypeId: InterventionType.initialNeed
      });
      const filter = await interventionMatchBuilder.getMatchFromQueryParams(findOptions.criterias);
      assert.deepEqual(filter, {
        $and: [{ interventionTypeId: { $in: [InterventionType.initialNeed] } }, { $or: getDefaultQueryStatuses }]
      });
    });
    it('C32602	Positive - Query estimate received, query value is transformed to integer and match option is returned', async () => {
      const findOptions = getFindOptions({
        estimate: 500
      });
      const filter = await interventionMatchBuilder.getMatchFromQueryParams(findOptions.criterias);
      assert.deepEqual(filter, {
        $and: [{ 'estimate.allowance': { $in: [500] } }, { $or: getDefaultQueryStatuses }]
      });
    });
  });
  describe('Tests getSortFromQueryParams', () => {
    let aggregate: Aggregate<IEnrichedIntervention[]>;

    function getFindOptions(props: IFindOptionsProps): InterventionFindOptions {
      return InterventionFindOptions.create({
        criterias: {},
        offset: constants.PaginationDefaults.OFFSET,
        limit: constants.PaginationDefaults.LIMIT,
        ...props
      }).getValue();
    }

    beforeEach(() => {
      aggregate = db().models.Intervention.aggregate();
    });

    function getPipelineItems(key: string): any[] {
      return aggregate
        .pipeline()
        .filter(p => p[key])
        .map(x => x[key]);
    }

    it('C31691	Positive - Queries can be sorted and option sort is well formated', () => {
      const findOptions = getFindOptions({ orderBy: '-status,interventionTypeId' });
      interventionRepository.setSort(aggregate, findOptions.orderByCriterias);
      assert.deepEqual(getPipelineItems('$sort')[0], { 'status_0.label.fr': -1 });
      assert.deepEqual(getPipelineItems('$sort')[1], { 'interventionTypeId_1.label.fr': 1 });
    });

    it('C31692	Positive - Non-existing sortable query is passed and ignored, returns options with only existing ones', () => {
      const findOptions = getFindOptions({ orderBy: '-status,estimate' });
      interventionRepository.setSort(aggregate, findOptions.orderByCriterias);
      assert.deepEqual(getPipelineItems('$sort')[0], {
        'status_0.label.fr': -1
      });
    });

    it('C31693	Positive - Queries can be sorted and option unwinds is well formated', () => {
      const findOptions = getFindOptions({ orderBy: 'workTypeId' });
      interventionRepository.setSort(aggregate, findOptions.orderByCriterias);
      assert.deepEqual(getPipelineItems('$sort')[0], {
        'workTypeId_0.label.fr': 1
      });
    });

    it('C31694	Positive - Queries can be sorted and option lookups is well formated', () => {
      const findOptions = getFindOptions({ orderBy: 'requestorId' });
      interventionRepository.setSort(aggregate, findOptions.orderByCriterias);
      assert.strictEqual(getPipelineItems('$lookup').length, 1);
      assert.deepEqual(getPipelineItems('$lookup')[0], {
        from: 'taxonomies',
        let: {
          code: '$requestorId'
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$code', '$$code']
                  },
                  {
                    $eq: ['$group', TaxonomyGroup.requestor]
                  }
                ]
              }
            }
          }
        ],
        as: 'requestorId_0'
      });
    });
  });
});
