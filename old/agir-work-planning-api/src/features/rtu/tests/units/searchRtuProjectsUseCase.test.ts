import {
  ErrorCodes,
  IGeometry,
  IPaginatedRtuProjects,
  IRtuProject
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import * as moment from 'moment';

import { userMocks } from '../../../../../tests/data/userMocks';
import { assertFailures, destroyDBTests } from '../../../../../tests/utils/testHelper';
import { userMocker } from '../../../../../tests/utils/userUtils';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { rtuProjectMapperDTO } from '../../mappers/rtuProjectMapperDTO';
import { RtuProjectFindOptions } from '../../models/rtuProjectFindOptions';
import { IRtuProjectsPaginatedFindOptionsProps } from '../../models/rtuProjectFindPaginatedOptions';
import { rtuProjectRepository } from '../../mongo/rtuProjectRepository';
import { searchRtuProjectsUseCase } from '../../useCases/searchRtuProjects/searchRtuProjectsUseCase';
import {
  assertDtoRtuProject,
  FROM_DATE_RTU_PROJECT,
  getRtuProject,
  infoRtuPartnerPartnerIds,
  REMOVE_GEOMETRY,
  rtuProjectsForbiddenSearchTests,
  rtuProjectsInvalidInputSearchTests,
  TO_DATE_RTU_PROJECT
} from '../rtuProjectTestHelper';

// tslint:disable:max-func-body-length
describe(`SearchRtuProjectsUseCase`, () => {
  describe(`Negative`, () => {
    beforeEach(() => {
      userMocker.mock(userMocks.pilot);
    });
    afterEach(async () => {
      await destroyDBTests();
      userMocker.reset();
    });

    const tests = rtuProjectsInvalidInputSearchTests;
    tests.push({
      description: 'invalid geometry',
      requestError: {
        intersectGeometry: ('-73.57118752198984,45.467047507449024' as unknown) as IGeometry
      } as any,
      expectedErrors: [
        {
          succeeded: false,
          target: 'intersectGeometry',
          code: ErrorCodes.InvalidInput,
          message: `intersectGeometry has an invalid geometry`
        }
      ]
    });

    tests.forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const searchRtuProjectQuery: IRtuProjectsPaginatedFindOptionsProps = {
          criterias: { ...test.requestError },
          limit: 10,
          offset: 0
        };
        const result = await searchRtuProjectsUseCase.execute(searchRtuProjectQuery);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });

    rtuProjectsForbiddenSearchTests.forEach(test => {
      it(`should return forbidden error when ${test.description} `, async () => {
        const searchRtuProjectQuery: IRtuProjectsPaginatedFindOptionsProps = {
          criterias: { ...test.requestError },
          limit: 10,
          offset: 0
        };
        userMocker.mock(test.user);
        const result = await searchRtuProjectsUseCase.execute(searchRtuProjectQuery);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, ForbiddenError, 'should be ForbiddenError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  describe(`Positive`, () => {
    describe(`with a pre-populated database`, () => {
      let project1Dto: IRtuProject = null;
      let project2Dto: IRtuProject = null;
      let project3Dto: IRtuProject = null;
      const RTU_PROJECT_TOTAL_COUNT = 3;
      const project1 = getRtuProject();
      const project2 = getRtuProject(
        {
          areaId: 'VM',
          partnerId: infoRtuPartnerPartnerIds[1],
          status: 'CO',
          phase: 'preliminaryConception',
          name: 'test find',
          dateStart: moment(FROM_DATE_RTU_PROJECT)
            .toDate()
            .getTime(),
          dateEnd: moment(TO_DATE_RTU_PROJECT)
            .toDate()
            .getTime(),
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-73.64129304885863, 45.532428348900794],
                [-73.6411052942276, 45.53259744983328],
                [-73.64145398139954, 45.53264630111914],
                [-73.64129304885863, 45.532428348900794]
              ]
            ]
          },
          geometryPin: [-73.64127829670906, 45.53254296181057]
        },
        '458'
      );
      const project3 = getRtuProject({ geometry: REMOVE_GEOMETRY }, '459');

      beforeEach(async () => {
        await rtuProjectRepository.save(project1);
        await rtuProjectRepository.save(project2);
        await rtuProjectRepository.save(project3);
        project1Dto = await rtuProjectMapperDTO.getFromModel(project1);
        project2Dto = await rtuProjectMapperDTO.getFromModel(project2);
        project3Dto = await rtuProjectMapperDTO.getFromModel(project3);
        userMocker.mock(userMocks.pilot);
      });
      afterEach(async () => {
        await destroyDBTests();
        userMocker.reset();
      });

      it(`should find rtu project according to areaId id or partnerId or status or phase or intersectGeometry`, async () => {
        const allOpportunityNotice = await rtuProjectRepository.findAll(
          RtuProjectFindOptions.create({
            criterias: {}
          }).getValue()
        );
        assert.strictEqual(allOpportunityNotice.length, RTU_PROJECT_TOTAL_COUNT);

        const testCases = [
          {
            name: 'testCases-1',
            criterias: {
              areaId: project1.areaId
            },
            expected: { count: 2, rtuProjects: [project3Dto, project1Dto] }
          },
          {
            name: 'testCases-2',
            criterias: {
              partnerId: project1.partnerId
            },
            expected: { count: 2, rtuProjects: [project3Dto, project1Dto] }
          },
          {
            name: 'testCases-3',
            criterias: {
              rtuStatus: project1.status
            },
            expected: { count: 2, rtuProjects: [project3Dto, project1Dto] }
          },
          {
            name: 'testCases-4',
            criterias: {
              phase: project1.phase
            },
            expected: { count: 2, rtuProjects: [project3Dto, project1Dto] }
          },
          {
            name: 'testCases-5',
            criterias: {
              fromDateStart: FROM_DATE_RTU_PROJECT
            },
            expected: { count: 1, rtuProjects: [project2Dto] }
          },
          {
            name: 'testCases-6',
            criterias: {
              toDateStart: TO_DATE_RTU_PROJECT
            },
            expected: { count: 3, rtuProjects: [project3Dto, project2Dto, project1Dto] }
          },
          {
            name: 'testCases-7',
            criterias: {
              fromDateEnd: TO_DATE_RTU_PROJECT
            },
            expected: { count: 1, rtuProjects: [project2Dto] }
          },
          {
            name: 'testCases-8',
            criterias: {
              toDateEnd: TO_DATE_RTU_PROJECT
            },
            expected: { count: 3, rtuProjects: [project3Dto, project2Dto, project1Dto] }
          },
          {
            name: 'testCases-9',
            criterias: {
              intersectGeometry: project2Dto.geometry
            },
            expected: { count: 1, rtuProjects: [project2Dto] }
          },
          {
            name: 'testCases-10',
            // test geometry and geometryPin
            criterias: {
              intersectGeometry: project1Dto.geometry
            },
            expected: { count: 2, rtuProjects: [project3Dto, project1Dto] }
          }
        ];

        for (const test of testCases) {
          const searchRtuProjectQuery: IRtuProjectsPaginatedFindOptionsProps = {
            criterias: test.criterias,
            limit: 100,
            offset: 0
          };
          const result = await searchRtuProjectsUseCase.execute(searchRtuProjectQuery);
          assert.isTrue(result.isRight());
          const found: IRtuProject[] = (result.value.getValue() as IPaginatedRtuProjects).items;
          assert.strictEqual(found.length, test.expected.count, `${test.name} failed`);
          found.forEach((f, idx) => {
            assertDtoRtuProject(f, test.expected.rtuProjects[idx], `${test.name} failed`);
          });
        }
      });

      it(`should find rtu project according to mix of criterias`, async () => {
        // add similar object like project 1 but only phase will be difference and criterias mas not found it
        await rtuProjectRepository.save(getRtuProject({ phase: 'preliminaryConception' }, '1111'));
        const allOpportunityNotice = await rtuProjectRepository.findAll(
          RtuProjectFindOptions.create({
            criterias: {}
          }).getValue()
        );
        assert.strictEqual(allOpportunityNotice.length, RTU_PROJECT_TOTAL_COUNT + 1);
        const searchRtuProjectQuery: IRtuProjectsPaginatedFindOptionsProps = {
          criterias: {
            areaId: project1.areaId,
            phase: project1.phase,
            rtuStatus: project1.status,
            partnerId: project1.partnerId
          },
          limit: 100,
          offset: 0
        };
        const result = await searchRtuProjectsUseCase.execute(searchRtuProjectQuery);
        assert.isTrue(result.isRight());
        const found: IRtuProject[] = (result.value.getValue() as IPaginatedRtuProjects).items;
        assert.strictEqual(found.length, 2);
        assertDtoRtuProject(found[0], project3Dto);
        assertDtoRtuProject(found[1], project1Dto);
      });

      it(`should find rtu project according to bbox`, async () => {
        const allOpportunityNotice = await rtuProjectRepository.findAll(
          RtuProjectFindOptions.create({
            criterias: {}
          }).getValue()
        );
        assert.strictEqual(allOpportunityNotice.length, RTU_PROJECT_TOTAL_COUNT);
        const searchRtuProjectQuery: IRtuProjectsPaginatedFindOptionsProps = {
          criterias: {
            bbox: '-73.57118752198984,45.467047507449024,-73.54472021547409,45.49088858087012'
          },
          limit: 100,
          offset: 0
        };
        const result = await searchRtuProjectsUseCase.execute(searchRtuProjectQuery);
        assert.isTrue(result.isRight());
        const found: IRtuProject[] = (result.value.getValue() as IPaginatedRtuProjects).items;
        assert.strictEqual(found.length, 2);
        assertDtoRtuProject(found[0], project3Dto);
        assertDtoRtuProject(found[1], project1Dto);
      });

      [
        {
          user: userMocks.admin,
          criterias: {
            partnerId: project1.partnerId
          }
        },
        {
          user: userMocks.pilot,
          criterias: {
            partnerId: project1.partnerId
          }
        },
        {
          user: userMocks.partnerProjectConsultation,
          criterias: {
            partnerId: project1.partnerId
          }
        }
      ].forEach(test => {
        it(`should ${test.user.userName} find rtu project with partnerId that belong to category partner`, async () => {
          const searchRtuProjectQuery: IRtuProjectsPaginatedFindOptionsProps = {
            criterias: test.criterias,
            limit: 100,
            offset: 0
          };
          const result = await searchRtuProjectsUseCase.execute(searchRtuProjectQuery);
          assert.isTrue(result.isRight());
          const found: IRtuProject[] = (result.value.getValue() as IPaginatedRtuProjects).items;
          assert.strictEqual(found.length, 2);
          assertDtoRtuProject(found[0], project3Dto);
          assertDtoRtuProject(found[1], project1Dto);
        });
      });

      it(`should find rtu project according to mix of criterias`, async () => {
        // add similar object like project 1 but only phase will be difference and criterias mas not found it
        await rtuProjectRepository.save(getRtuProject({ phase: 'preliminaryConception' }, '1111'));
        const allOpportunityNotice = await rtuProjectRepository.findAll(
          RtuProjectFindOptions.create({
            criterias: {}
          }).getValue()
        );
        assert.strictEqual(allOpportunityNotice.length, RTU_PROJECT_TOTAL_COUNT + 1);
        const searchRtuProjectQuery: IRtuProjectsPaginatedFindOptionsProps = {
          criterias: {
            areaId: project1.areaId,
            phase: project1.phase,
            rtuStatus: project1.status,
            partnerId: project1.partnerId
          },
          limit: 100,
          offset: 0
        };
        const result = await searchRtuProjectsUseCase.execute(searchRtuProjectQuery);
        assert.isTrue(result.isRight());
        const found: IRtuProject[] = (result.value.getValue() as IPaginatedRtuProjects).items;
        assert.strictEqual(found.length, 2);
        assertDtoRtuProject(found[0], project3Dto);
        assertDtoRtuProject(found[1], project1Dto);
      });

      [
        {
          fields: ['status']
        },
        {
          fields: ['dateStart']
        },
        {
          fields: ['dateEnd']
        },
        {
          fields: ['partnerId']
        },
        {
          fields: ['contact']
        },
        {
          fields: ['status', 'dateStart', 'dateEnd', 'partnerId', 'contact']
        }
      ].forEach(test => {
        it(`should only return the id and these properties : [${test.fields.join(',')}]`, async () => {
          const searchRtuProjectQuery: IRtuProjectsPaginatedFindOptionsProps = {
            criterias: {},
            limit: 100,
            offset: 0,
            fields: test.fields.join(',')
          };
          const result = await searchRtuProjectsUseCase.execute(searchRtuProjectQuery);
          assert.isTrue(result.isRight());
          const rtuProjects: IRtuProject[] = (result.value.getValue() as IPaginatedRtuProjects).items;
          for (const rtuProject of rtuProjects) {
            assert.exists(rtuProject.id);
            test.fields.forEach(field => {
              assert.exists(rtuProject[field], `${field} not found`);
            });
            assert.lengthOf(Object.keys(rtuProject), test.fields.length + 1);
          }
        });
      });
      // END Positive tests
    });
  });
});
