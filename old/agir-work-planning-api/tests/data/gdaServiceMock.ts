import { constants, Role } from '@villemontreal/agir-work-planning-lib';

import { IGdaPrivileges, IGdaProvisioningRequestBody, IGdaProvisioningResponseBody } from '../../src/models/gda';
import { IGdaService } from '../../src/services/gdaService';
import { getPermissionsFromProvisioning } from '../../src/utils/gdaUtils';
import { createLogger } from '../../src/utils/logger';

const logger = createLogger('gdaServiceMock');

export class GdaServiceMock implements IGdaService {
  /**
   * Nothing is done in mock, used to have available call in init process appilcation
   */
  public async provision(
    provision: IGdaProvisioningRequestBody,
    accessToken: string
  ): Promise<IGdaProvisioningResponseBody> {
    logger.info('Mock provision called');
    return {} as IGdaProvisioningResponseBody;
  }

  /**
   * Use provision.json to find permissions and create the mock gdaPrivileges
   * @param accessToken accesToken is used like role because in mock we dont have a real accessToken
   * @param applicationCode use to complete object IGdaPrivileges
   */
  public async getPrivileges(accessToken: string, applicationCode: string): Promise<IGdaPrivileges[]> {
    // IF ROLE(accessToken) IS EMPTY getPermissionsFromProvisioning WILL FIND PERMISSIONS FOR ROLE FULL_ACCESS
    return [
      {
        domain: constants.GDA.DOMAIN_CODE_GESTION_TERRITOIRE,
        application: applicationCode,
        role: accessToken as Role,
        permissions: await getPermissionsFromProvisioning(accessToken === '' ? undefined : (accessToken as Role)),
        restrictions: {}
      }
    ];
  }
}
