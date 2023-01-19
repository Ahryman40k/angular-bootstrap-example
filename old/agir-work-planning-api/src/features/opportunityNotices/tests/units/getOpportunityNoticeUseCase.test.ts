import {
  ErrorCodes,
  IEnrichedOpportunityNotice,
  IEnrichedProject,
  OpportunityNoticeStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';

import { projectDataGenerator } from '../../../../../tests/data/dataGenerators/projectDataGenerator';
import {
  assertFailures,
  destroyDBTests,
  INVALID_UUID,
  mergeProperties,
  NOT_FOUND_UUID
} from '../../../../../tests/utils/testHelper';
import { IByUuidCommandProps } from '../../../../shared/domain/useCases/byUuidCommand';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { IGuardResult } from '../../../../shared/logic/guard';
import { TimeUnits } from '../../../../utils/moment/moment.enum';
import { getAudit, getDateUnitsAgo } from '../../../audit/test/auditTestHelper';
import { OpportunityNotice } from '../../models/opportunityNotice';
import { opportunityNoticeRepository } from '../../mongo/opportunityNoticeRepository';
import { getOpportunityNoticeUseCase } from '../../useCases/getOpportunityNotice/getOpportunityNoticeUseCase';
import { assertOpportunityNotice, DAYS_AGO, getOpportunityNotice } from '../opportunityNoticeTestHelper';

// tslint:disable:max-func-body-length
describe(`GetOpportunityNoticeUseCase`, () => {
  describe(`Negative`, () => {
    afterEach(async () => {
      await destroyDBTests();
    });

    [
      {
        description: 'missing opportunity notice id',
        requestError: {
          id: undefined
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'id',
            code: ErrorCodes.MissingValue,
            message: `id is null or undefined`
          }
        ]
      },
      {
        description: 'invalid  opportunity notice id',
        requestError: {
          id: INVALID_UUID
        },
        expectedErrors: [
          {
            succeeded: false,
            target: 'id',
            code: ErrorCodes.InvalidInput,
            message: `id has a bad format`
          }
        ]
      }
    ].forEach(test => {
      it(`should return errors when ${test.description} `, async () => {
        const getOpportunityNoticeCommand: IByUuidCommandProps = {
          id: NOT_FOUND_UUID
        };
        const result = await getOpportunityNoticeUseCase.execute(
          mergeProperties(getOpportunityNoticeCommand, test.requestError)
        );
        assert.isTrue(result.isLeft());
        assert.strictEqual(result.value.constructor, InvalidParameterError, 'should be InvalidParameterError');
        const failures: IGuardResult[] = result.value.error.error;
        assertFailures(failures, test.expectedErrors);
      });
    });
  });

  it(`should return notFoundError when given opportunity notice id do not exists`, async () => {
    const getOpportunityNoticeCommand: IByUuidCommandProps = {
      id: NOT_FOUND_UUID
    };
    const result = await getOpportunityNoticeUseCase.execute(getOpportunityNoticeCommand);
    assert.isTrue(result.isLeft());
    assert.strictEqual(result.value.constructor, NotFoundError, 'should be NotFoundError');
  });

  describe(`with a pre-populated database`, () => {
    let project: IEnrichedProject;
    let currentOpportunityNotice: OpportunityNotice;
    beforeEach(async () => {
      project = await projectDataGenerator.store({});
      currentOpportunityNotice = (
        await opportunityNoticeRepository.save(getOpportunityNotice({ projectId: project.id }))
      ).getValue();
    });

    it(`should retrieve opportunity notice by id`, async () => {
      const existingOpportunityNotice = await opportunityNoticeRepository.findById(currentOpportunityNotice.id);
      assert.isDefined(existingOpportunityNotice);

      const getOpportunityNoticeCommand: IByUuidCommandProps = {
        id: currentOpportunityNotice.id.toString()
      };
      const result = await getOpportunityNoticeUseCase.execute(getOpportunityNoticeCommand);
      assert.isTrue(result.isRight());
      const opportunityNotice = result.value.getValue() as IEnrichedOpportunityNotice;
      assertOpportunityNotice(opportunityNotice, existingOpportunityNotice);
    });

    it(`should retrieve opportunity notice created eight days ago and change it status from new to inProgress`, async () => {
      const opportunityNoticeCreatedSevenDaysOld = getOpportunityNotice({
        projectId: project.id,
        audit: getAudit({ createdAt: getDateUnitsAgo(DAYS_AGO, TimeUnits.DAY) })
      });
      await opportunityNoticeRepository.save(opportunityNoticeCreatedSevenDaysOld);

      const existingOpportunityNotice = await opportunityNoticeRepository.findById(
        opportunityNoticeCreatedSevenDaysOld.id
      );
      assert.isDefined(existingOpportunityNotice);

      const getOpportunityNoticeCommand: IByUuidCommandProps = {
        id: opportunityNoticeCreatedSevenDaysOld.id.toString()
      };
      const result = await getOpportunityNoticeUseCase.execute(getOpportunityNoticeCommand);
      assert.isTrue(result.isRight());
      const opportunityNotice = result.value.getValue() as IEnrichedOpportunityNotice;
      assert.strictEqual(opportunityNotice.status, OpportunityNoticeStatus.inProgress);
    });

    it(`should get opportunity notice created less than seven days ago and the status remains to new`, async () => {
      const opportunityNoticeCreatedSixDaysOld = getOpportunityNotice({
        projectId: project.id,
        audit: getAudit({ createdAt: getDateUnitsAgo(6, TimeUnits.DAY) })
      });
      await opportunityNoticeRepository.save(opportunityNoticeCreatedSixDaysOld);

      const existingOpportunityNotice = await opportunityNoticeRepository.findById(
        opportunityNoticeCreatedSixDaysOld.id
      );
      assert.isDefined(existingOpportunityNotice);

      const getOpportunityNoticeCommand: IByUuidCommandProps = {
        id: opportunityNoticeCreatedSixDaysOld.id.toString()
      };
      const result = await getOpportunityNoticeUseCase.execute(getOpportunityNoticeCommand);
      assert.isTrue(result.isRight());
      const opportunityNotice = result.value.getValue() as IEnrichedOpportunityNotice;
      assert.strictEqual(opportunityNotice.status, OpportunityNoticeStatus.new);
    });
  });
});
