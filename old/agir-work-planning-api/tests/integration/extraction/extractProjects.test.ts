import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { assert } from 'chai';
import { constants, EndpointTypes } from '../../../config/constants';
import { appUtils } from '../../../src/utils/utils';
import { userMocks } from '../../data/userMocks';
import { requestService } from '../../utils/requestService';
import { userMocker } from '../../utils/userUtils';
import { integrationAfter } from '../_init.test';

// tslint:disable-next-line:max-func-body-length
describe('Extract projects', () => {
  const apiUrlProjects: string = appUtils.createPublicFullPath(constants.locationPaths.PROJECT, EndpointTypes.API);
  before(() => {
    userMocker.mock(userMocks.partnerProjectConsultation);
  });

  after(async () => {
    userMocker.reset();
    await integrationAfter();
  });

  it('Negative - Should return forbidden if the PROJECT:EXTRACT permission is missing', async () => {
    const response = await requestService.post(`${apiUrlProjects}/extract`, {
      body: { year: 2000, fields: ['id'] }
    });
    assert.strictEqual(response.status, HttpStatusCodes.FORBIDDEN);
    assert.isTrue(
      String(response.body.error.message).indexOf('is not allowed to execute the action. Permission: PROJECT:EXTRACT') >
        -1
    );
  });
});
