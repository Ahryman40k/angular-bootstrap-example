import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { assert } from 'chai';
import { constants, EndpointTypes } from '../../../config/constants';
import { appUtils } from '../../../src/utils/utils';
import { userMocks } from '../../data/userMocks';
import { requestService } from '../../utils/requestService';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

// tslint:disable-next-line:max-func-body-length
describe('Extract interventions', () => {
  const apiUrlInterventions: string = appUtils.createPublicFullPath(
    constants.locationPaths.INTERVENTION,
    EndpointTypes.API
  );
  before(() => {
    userMocker.mock(userMocks.partnerProjectConsultation);
  });

  after(async () => {
    userMocker.reset();
    await integrationAfter();
  });

  it('Negative - Should return forbidden if the INTERVENTION:EXTRACT permission is missing', async () => {
    const response = await requestService.post(`${apiUrlInterventions}/extract`, {
      body: { planificationYear: 2000, fields: ['id'] }
    });
    assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
    assert.isTrue(
      String(response.body.error.message).indexOf(
        'is not allowed to execute the action. Permission: INTERVENTION:EXTRACT'
      ) > -1
    );
  });
});
