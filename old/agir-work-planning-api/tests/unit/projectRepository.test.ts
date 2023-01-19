import { ProjectExternalReferenceType, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib';
import { assert } from 'chai';
import * as mongoose from 'mongoose';

import { constants } from '../../config/constants';
import { db } from '../../src/features/database/DB';
import { ImportFlag } from '../../src/features/imports/enums/importFlag';
import { IProjectFindOptionsProps, ProjectFindOptions } from '../../src/features/projects/models/projectFindOptions';
import { projectRepository } from '../../src/features/projects/mongo/projectRepository';
import { projectMatchBuilder } from '../../src/features/projects/projectMatchBuilder';
import { integrationAfter } from '../integration/_init.test';

// Disabling the "function length" rule is OK for the test files.
// tslint:disable:max-func-body-length

describe('Project repository', () => {
  function getFindOptions(props: Partial<IProjectFindOptionsProps>): ProjectFindOptions {
    return ProjectFindOptions.create({
      criterias: props.criterias,
      offset: constants.PaginationDefaults.OFFSET,
      limit: constants.PaginationDefaults.LIMIT,
      ...props
    }).getValue();
  }

  let aggregate: mongoose.Aggregate<any>;
  const allStatuses = ProjectFindOptions.getDefaultStatuses();

  after(async () => {
    await integrationAfter();
  });

  describe('Tests getFilterFromQueryParams', () => {
    it('C48006  Positive - Queries are formated to be a mongo match parameter', async () => {
      const findOptions = getFindOptions({ criterias: { startYear: 2, executorId: 'FA' } });
      const filter = await projectMatchBuilder.getMatchFromQueryParams(findOptions.criterias);
      assert.deepEqual(filter, {
        $and: [
          {
            startYear: { $in: [2] }
          },
          { executorId: { $in: ['FA'] } },
          {
            status: { $in: allStatuses }
          }
        ]
      });
    });
    it('C48007  Positive - Geometry is queried and is formated to be a mongo match parameter', async () => {
      const findOptions = getFindOptions({
        criterias: {
          bbox: '-73.558166,45.498458,-73.552898,45.496533'
        }
      });
      const filter = await projectMatchBuilder.getMatchFromQueryParams(findOptions.criterias);
      assert.deepEqual(filter, {
        $and: [
          {
            geometry: {
              $geoIntersects: {
                $geometry: {
                  coordinates: [
                    [
                      [-73.558166, 45.498458],
                      [-73.552898, 45.498458],
                      [-73.552898, 45.496533],
                      [-73.558166, 45.496533],
                      [-73.558166, 45.498458]
                    ]
                  ],
                  type: 'Polygon'
                }
              }
            }
          },
          {
            status: { $in: allStatuses }
          }
        ]
      });
    });
    it('C48008  Positive - "from" or "to" and a strict equal is also specified, only equal will be considerated', async () => {
      const findOptions = getFindOptions({
        criterias: {
          startYear: 2021,
          fromStartYear: 2019,
          toStartYear: 2022,
          fromEndYear: 1,
          endYear: 2,
          executorId: 'FA'
        }
      });
      const filter = await projectMatchBuilder.getMatchFromQueryParams(findOptions.criterias);
      assert.deepEqual(filter, {
        $and: [
          {
            startYear: { $in: [2021] }
          },
          { endYear: { $in: [2] } },
          { executorId: { $in: ['FA'] } },
          {
            status: { $in: allStatuses }
          }
        ]
      });
    });
    it('C48009  Positive - "from" or "to" are specified for a parameter, that parameter will contain $lte or $gte', async () => {
      const findOptions = getFindOptions({
        criterias: {
          fromStartYear: 2019,
          toStartYear: 2022,
          fromEndYear: 1,
          executorId: 'FA'
        }
      });
      const filter = await projectMatchBuilder.getMatchFromQueryParams(findOptions.criterias);
      assert.deepEqual(filter, {
        $and: [
          {
            startYear: { $gte: 2019 }
          },
          {
            startYear: { $lte: 2022 }
          },
          { endYear: { $gte: 1 } },
          { executorId: { $in: ['FA'] } },
          { status: { $in: allStatuses } }
        ]
      });
    });
    it('C48010  Positive - Received empty query, returns empty filter object', async () => {
      const findOptions = getFindOptions({ criterias: {} });
      const filter = await projectMatchBuilder.getMatchFromQueryParams(findOptions.criterias);
      assert.deepEqual(filter, { $and: [{ status: { $in: allStatuses } }] });
    });
    it('C48011  Positive - Query startYear received, query value is transformed to integer and match option is returned', async () => {
      const findOptions = getFindOptions({
        criterias: {
          endYear: 2030
        }
      });
      const filter = await projectMatchBuilder.getMatchFromQueryParams(findOptions.criterias);

      assert.deepEqual(filter, {
        $and: [
          {
            endYear: { $in: [2030] }
          },
          {
            status: { $in: allStatuses }
          }
        ]
      });
    });
    it('C48012 Positive - should build query filter to exclude projects coming from import BIC', async () => {
      const projectFindOptions = ProjectFindOptions.create({
        criterias: {
          excludeImportBic: true
        }
      }).getValue();
      const match = await projectMatchBuilder.getMatchFromQueryParams(projectFindOptions.criterias);
      const expectedMatch = {
        $and: [
          {
            importFlag: { $ne: ImportFlag.internal },
            'externalReferenceIds.type': { $ne: ProjectExternalReferenceType.infoRTUReferenceNumber }
          },
          {
            status: { $in: allStatuses }
          }
        ]
      };
      assert.deepEqual(match, expectedMatch);
    });
  });

  describe('Tests getSortFromQueryParams', () => {
    beforeEach(() => {
      aggregate = db().models.Project.aggregate();
    });

    function getPipelineItems(key: string): any[] {
      return aggregate
        .pipeline()
        .filter(p => p[key])
        .map(x => x[key]);
    }

    it('C48012  Positive - Queries can be sorted and option sort is well formatted', () => {
      const findOptions = getFindOptions({ orderBy: '-status,projectTypeId' });
      projectRepository.setSort(aggregate, findOptions.orderByCriterias);
      assert.deepEqual(getPipelineItems('$sort')[0], {
        'status_0.label.fr': -1
      });
      assert.deepEqual(getPipelineItems('$sort')[1], {
        'projectTypeId_1.label.fr': 1
      });
    });
    it('C48013  Positive - Non-existing sortable query is passed and ignored, returns options with only existing ones', () => {
      const findOptions = getFindOptions({ orderBy: '-status,startYear' });
      projectRepository.setSort(aggregate, findOptions.orderByCriterias);
      assert.deepEqual(getPipelineItems('$sort')[0], {
        'status_0.label.fr': -1
      });
    });
    it('C48014  Positive - Queries can be sorted with field set ', () => {
      const findOptions = getFindOptions({ orderBy: 'executorId' });
      projectRepository.setSort(aggregate, findOptions.orderByCriterias);
      assert.deepEqual(getPipelineItems('$sort')[0], {
        'executorId_0.label.fr': 1
      });
    });
    it('C48015  Positive - Queries can be sorted and option lookups is well formatted', () => {
      const findOptions = getFindOptions({ orderBy: 'executorId' });
      projectRepository.setSort(aggregate, findOptions.orderByCriterias);
      assert.strictEqual(getPipelineItems('$lookup').length, 1);
      assert.deepEqual(getPipelineItems('$lookup')[0], {
        from: 'taxonomies',
        let: {
          code: '$executorId'
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
                    $eq: ['$group', TaxonomyGroup.executor]
                  }
                ]
              }
            }
          }
        ],
        as: 'executorId_0'
      });
    });
  });
});
