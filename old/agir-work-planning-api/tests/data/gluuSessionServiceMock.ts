import {
  IGluuClientInfo,
  IGluuFilterParameters,
  IGluuGroup,
  IGluuGroups,
  IGluuIntrospect,
  IGluuService,
  IGluuSessionService,
  IGluuTokenExtend,
  IGluuUser,
  IGluuUserInfo,
  IGluuUsers
} from '@villemontreal/core-gluu-authentication-nodejs-lib';
import { ITokenManager } from '@villemontreal/core-gluu-authentication-nodejs-lib/dist/src/services/token/tokenManager';

export class MockGluuSessionService implements IGluuSessionService {
  public _gluuService: IGluuService;
  public _tokenManager: ITokenManager;

  public getToken(): Promise<IGluuTokenExtend> {
    const token: IGluuTokenExtend = {
      access_token: '',
      expires_in: 0,
      token_type: '',
      refresh_token: ''
    };
    return Promise.resolve(token);
  }
  public getUserInfo(accessToken: string): Promise<IGluuUserInfo> {
    throw new Error('Method not implemented.');
  }
  public getClientInfo(accessToken: string): Promise<IGluuClientInfo> {
    throw new Error('Method not implemented.');
  }
  public introspect(accessToken: string): Promise<IGluuIntrospect> {
    throw new Error('Method not implemented.');
  }
  public scimGetUsers(params?: IGluuFilterParameters): Promise<IGluuUsers> {
    throw new Error('Method not implemented.');
  }
  public scimGetUser(userInum: string): Promise<IGluuUser> {
    throw new Error('Method not implemented.');
  }
  public scimAddUser(user: IGluuUser): Promise<IGluuUser> {
    throw new Error('Method not implemented.');
  }
  public scimUpdateUser(userInum: string, user: IGluuUser): Promise<IGluuUser> {
    throw new Error('Method not implemented.');
  }
  public scimDelUser(userInum: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  public scimGetGroups(params?: IGluuFilterParameters): Promise<IGluuGroups> {
    throw new Error('Method not implemented.');
  }
  public scimGetGroup(groupInum: string): Promise<IGluuGroup> {
    throw new Error('Method not implemented.');
  }
  public scimAddGroup(group: IGluuGroup): Promise<IGluuGroup> {
    throw new Error('Method not implemented.');
  }
  public scimUpdateGroup(groupInum: string, group: IGluuGroup): Promise<IGluuGroup> {
    throw new Error('Method not implemented.');
  }
  public scimDelGroup(groupInum: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
