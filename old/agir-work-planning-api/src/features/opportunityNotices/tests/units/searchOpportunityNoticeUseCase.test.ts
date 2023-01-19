import {
  AssetType,
  ErrorCodes,
  IEnrichedOpportunityNotice,
  IEnrichedOpportunityNoticePaginated,
  IEnrichedProject,
  OpportunityNoticeStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { isEqual } from 'lodash';

import { projectDataGenerator } from '../../../../../tests/data/dataGenerators/projectDataGenerator';
import { assertFailures, destroyDBTests, INVALID_PROJECT_ID } from '../../../../../tests/utils/testHelper';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { TimeUnits } from '../../../../utils/moment/moment.enum';
import { MomentUtils } from '../../../../utils/moment/momentUtils';
import { appUtils } from '../../../../utils/utils';
import { getAssetProps } from '../../../asset/tests/assetTestHelper';
import { getAudit } from '../../../audit/test/auditTestHelper';
import { opportunityNoticeMapperDTO } from '../../mappers/opportunityNoticeMapperDTO';
import { OpportunityNotice } from '../../models/opportunityNotice';
import { OpportunityNoticeFindOptions } from '../../models/opportunityNoticeFindOptions';
import { IOpportunityNoticePaginatedFindOptionsProps } from '../../models/opportunityNoticeFindPaginatedOptions';
import { opportunityNoticeRepository } from '../../mongo/opportunityNoticeRepository';
import { searchOpportunityNoticeUseCase } from '../../useCases/searchOpportunityNotice/searchOpportunityNoticeUseCase';
import {
  assertOpportunityNotice,
  CONTACT_INFO,
  createOpportunityNoticesForTest,
  DAYS_AGO,
  NUMBER_OF_OPPORTUNITY_BY_PROJECT,
  NUMBER_OF_OPPORTUNITY_NOTICE_CREATED_SEVEN_DAYS_AGO
} from '../opportunityNoticeTestHelper';

// tslint:disable:max-func-body-length
describe(`SearchOpportunityNoticeUseCase`, () => {
  describe(`Negative`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    [
      {
        description: 'invalid projectId',
        requestError: {
          projectId: INVALID_PROJECT_ID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'projectId',
            code: ErrorCodes.InvalidInput,
            message: `projectId has a bad format`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const searchOpportunityNoticeQuery: IOpportunityNoticePaginatedFindOptionsProps = {
          criterias: { ...test.requestError },
          limit: 10,
          offset: 0
        };
        const result = await searchOpportunityNoticeUseCase.execute(searchOpportunityNoticeQuery);
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = (result.value as any).error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  describe(`Positive`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    describe(`with a pre-populated database`, () => {
      const projectProps = {
        startYear: appUtils.getCurrentYear(),
        endYear: MomentUtils.add(MomentUtils.now(), 3, TimeUnits.YEAR).getFullYear()
      };

      let project1: IEnrichedProject;
      let project2: IEnrichedProject;
      let opportunityNotice: IEnrichedOpportunityNotice;
      beforeEach(async () => {
        project1 = await projectDataGenerator.store(projectProps);
        project2 = await projectDataGenerator.store(projectProps);
        const opportunityNotices = await createOpportunityNoticesForTest(
          { projectId: project1.id },
          NUMBER_OF_OPPORTUNITY_BY_PROJECT
        );
        await createOpportunityNoticesForTest({ projectId: project2.id }, NUMBER_OF_OPPORTUNITY_BY_PROJECT);
        opportunityNotice = await opportunityNoticeMapperDTO.getFromModel(opportunityNotices.find(x => x));
      });

      it(`should find opportunity notice according to project id`, async () => {
        const allOpportunityNotice = await opportunityNoticeRepository.findAll(
          OpportunityNoticeFindOptions.create({
            criterias: {}
          }).getValue()
        );
        assert.strictEqual(allOpportunityNotice.length, NUMBER_OF_OPPORTUNITY_BY_PROJECT * 2);

        const testCases = [
          {
            projectId: project1.id,
            expected: NUMBER_OF_OPPORTUNITY_BY_PROJECT
          },
          {
            projectId: project2.id,
            expected: NUMBER_OF_OPPORTUNITY_BY_PROJECT
          }
        ];

        for (const test of testCases) {
          const searchOpportunityNoticeQuery: IOpportunityNoticePaginatedFindOptionsProps = {
            criterias: {
              projectId: test.projectId
            },
            limit: 100,
            offset: 0
          };
          const result = await searchOpportunityNoticeUseCase.execute(searchOpportunityNoticeQuery);
          assert.isTrue(result.isRight());
          const found: IEnrichedOpportunityNotice[] = (result.value.getValue() as IEnrichedOpportunityNoticePaginated)
            .items;
          assert.strictEqual(found.length, test.expected);
          if (test.projectId === project1.id) {
            assertOpportunityNotice(found[0], opportunityNotice);
          }
        }
      });
    });

    describe(`sorting`, () => {
      const projectProps = {
        startYear: appUtils.getCurrentYear(),
        endYear: MomentUtils.add(MomentUtils.now(), 3, TimeUnits.YEAR).getFullYear()
      };

      let project: IEnrichedProject;
      let opportunityNotice1: OpportunityNotice;
      let opportunityNotice2: OpportunityNotice;
      let opportunityNotice3: OpportunityNotice;
      beforeEach(async () => {
        project = await projectDataGenerator.store(projectProps);
        opportunityNotice1 = (
          await createOpportunityNoticesForTest(
            {
              object: '1',
              projectId: project.id,
              requestorId: 'senv',
              status: OpportunityNoticeStatus.inProgress,
              assets: [
                getAssetProps({
                  typeId: AssetType.sewerSump
                })
              ],
              audit: getAudit()
            },
            1
          )
        ).find(x => x);
        // Delay to have different audit.createAt
        await appUtils.delay(1);
        opportunityNotice2 = (
          await createOpportunityNoticesForTest(
            {
              object: '2',
              projectId: project.id,
              requestorId: 'dre',
              status: OpportunityNoticeStatus.closed,
              assets: [
                getAssetProps({
                  typeId: AssetType.roadway
                })
              ],
              audit: getAudit()
            },
            1
          )
        ).find(x => x);
        await appUtils.delay(1);
        opportunityNotice3 = (
          await createOpportunityNoticesForTest(
            {
              object: '3',
              projectId: project.id,
              requestorId: 'hq',
              status: OpportunityNoticeStatus.new,
              assets: [
                getAssetProps({
                  typeId: AssetType.basin
                })
              ],
              audit: getAudit()
            },
            1
          )
        ).find(x => x);
        const opportunityNotices = [opportunityNotice1, opportunityNotice2, opportunityNotice3];
        await opportunityNoticeRepository.saveBulk(opportunityNotices);
      });

      [
        {
          description: 'sort by requestorId asc',
          orderBy: 'requestorId',
          expectedOrder: ['2', '3', '1']
        },
        {
          description: 'sort by requestorId desc',
          orderBy: '-requestorId',
          expectedOrder: ['1', '3', '2']
        },
        {
          description: 'sort by status asc',
          orderBy: 'status',
          expectedOrder: ['1', '2', '3']
        },
        {
          description: 'sort by asset typeId desc',
          orderBy: '-typeId',
          expectedOrder: ['1', '2', '3']
        },
        {
          description: 'sort by asset typeId asc',
          orderBy: 'typeId',
          expectedOrder: ['3', '2', '1']
        },
        {
          description: 'sort by asset createdAt desc',
          orderBy: '-createdAt',
          expectedOrder: ['3', '2', '1']
        },
        {
          description: 'sort by asset createdAt asc',
          orderBy: 'createdAt',
          expectedOrder: ['1', '2', '3']
        }
      ].forEach(test => {
        it(`should ${test.description} `, async () => {
          const searchOpportunityNoticeQuery: IOpportunityNoticePaginatedFindOptionsProps = {
            criterias: {},
            orderBy: test.orderBy,
            limit: 10,
            offset: 0
          };
          const result = await searchOpportunityNoticeUseCase.execute(searchOpportunityNoticeQuery);
          assert.isTrue(result.isRight());
          const foundNotices: IEnrichedOpportunityNotice[] = (result.value.getValue() as IEnrichedOpportunityNoticePaginated)
            .items;
          assert.isTrue(
            isEqual(
              foundNotices.map(notice => notice.object),
              test.expectedOrder
            )
          );
        });
      });
    });

    describe(`changing status from new to inProgress`, () => {
      const projectProps = {
        startYear: appUtils.getCurrentYear(),
        endYear: MomentUtils.add(MomentUtils.now(), 3, TimeUnits.YEAR).getFullYear()
      };

      let project: IEnrichedProject;
      beforeEach(async () => {
        project = await projectDataGenerator.store(projectProps);
        await createOpportunityNoticesForTest({ projectId: project.id }, NUMBER_OF_OPPORTUNITY_BY_PROJECT);
        await createOpportunityNoticesForTest(
          { projectId: project.id },
          NUMBER_OF_OPPORTUNITY_NOTICE_CREATED_SEVEN_DAYS_AGO,
          DAYS_AGO
        );
      });

      [
        {
          expected: NUMBER_OF_OPPORTUNITY_BY_PROJECT + NUMBER_OF_OPPORTUNITY_NOTICE_CREATED_SEVEN_DAYS_AGO
        }
      ].forEach(test => {
        it(`should find opportunity notice according to project id and change it status from new to inProgress if it was created seven days ago`, async () => {
          const allOpportunityNotice = await opportunityNoticeRepository.findAll(
            OpportunityNoticeFindOptions.create({
              criterias: {}
            }).getValue()
          );
          assert.strictEqual(
            allOpportunityNotice.length,
            NUMBER_OF_OPPORTUNITY_BY_PROJECT + NUMBER_OF_OPPORTUNITY_NOTICE_CREATED_SEVEN_DAYS_AGO
          );

          const searchOpportunityNoticeQuery: IOpportunityNoticePaginatedFindOptionsProps = {
            criterias: {
              projectId: project.id
            },
            limit: 100,
            offset: 0
          };
          const result = await searchOpportunityNoticeUseCase.execute(searchOpportunityNoticeQuery);
          assert.isTrue(result.isRight());
          const found: IEnrichedOpportunityNotice[] = (result.value.getValue() as IEnrichedOpportunityNoticePaginated)
            .items;
          assert.strictEqual(found.length, test.expected);
          if (found[0].contactInfo === CONTACT_INFO) {
            assert.strictEqual(found[0].status, OpportunityNoticeStatus.inProgress);
          } else {
            assert.strictEqual(found[0].status, OpportunityNoticeStatus.new);
          }
        });
      });
    });
  });
});
