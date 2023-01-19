import { constants, Role } from '@villemontreal/agir-work-planning-lib';
import { IJWTPayload } from '@villemontreal/core-jwt-validator-nodejs-lib';

import { ITokenTranslatorService } from '../../src/services/tokenTranslatorService';
import { getPermissionsFromProvisioning } from '../../src/utils/gdaUtils';

export class TokenTranslatorServiceMock implements ITokenTranslatorService {
  /**
   * Mock a webtoken using the provisioning file, accesToken simulate a ROLE to find permissions
   * @param accessToken ROLE
   * @param applicationCode APPLICATION_CODE
   */
  public async getWebToken(accessToken: string, applicationCode?: string): Promise<IJWTPayload> {
    return {
      displayName: 'mockAccessToken',
      userName: 'mockAccessToken',
      name: 'mockAccessToken',
      givenName: 'mockAccessToken',
      familyName: 'mockAccessToken',
      customData: await this.getPrivileges(accessToken, applicationCode)
    } as IJWTPayload;
  }

  /**
   * Use provision.json to find permissions and create the mock gdaPrivileges
   * @param accessToken accesToken is used like role because in mock we dont have a real accessToken
   * @param applicationCode use to complete object IGdaPrivileges
   */
  private async getPrivileges(accessToken: string, applicationCode: string): Promise<any[]> {
    // IF ROLE(accessToken) IS EMPTY getPe  rmissionsFromProvisioning WILL FIND PERMISSIONS FOR ROLE FULL_ACCESS
    return [
      {
        domain: constants.GDA.DOMAIN_CODE_GESTION_TERRITOIRE,
        application: applicationCode,
        role: accessToken as Role,
        permissions: await getPermissionsFromProvisioning(accessToken === '' ? undefined : (accessToken as Role)),
        // restrictions: { RESOURCE: ['interventions/5d3716b474e2e469acdaa98e'] }  // simulate case restriction by url
        restrictions: { RESOURCE: ['*'] }
      }
    ];
  }
}
