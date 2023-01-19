import { gluuSessionService, IGluuSessionService } from '@villemontreal/core-gluu-authentication-nodejs-lib';

import { configs } from '../../config/configs';
import { MockGluuSessionService } from '../../tests/data/gluuSessionServiceMock';

class GluuServiceFactory {
  private _sessionService: IGluuSessionService;
  public get sessionService(): IGluuSessionService {
    if (!this._sessionService) {
      this._sessionService = this.createSessionService();
    }
    return this._sessionService;
  }

  /**
   * Creates the GLUU session service.
   * Checks in the config if it must be mocked or not.
   */
  private createSessionService(): IGluuSessionService {
    return configs.gluu.mock ? new MockGluuSessionService() : gluuSessionService;
  }

  public async getAcessToken(): Promise<string> {
    const gluuToken = await this.sessionService.getToken();
    return gluuToken.access_token;
  }
}
export const gluuServiceFactory = new GluuServiceFactory();
