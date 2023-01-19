import { IGdaPrivileges, User } from '@villemontreal/agir-work-planning-lib';

import { IRestriction } from '../../src/shared/restrictions/userRestriction';
import { userMocks } from '../data/userMocks';

/**
 * Mocks the user for tests.
 */
class UserMocker {
  public readonly defaultUser = userMocks.planner;

  private _currentMock = this.defaultUser;

  public get currentMock(): User {
    return this._currentMock;
  }

  public mock(user: User): void {
    this._currentMock = user;
  }

  public mockRestrictions(restrictions: IRestriction) {
    const customData = this._currentMock.customData.map((el: IGdaPrivileges) => {
      return { ...el, restrictions };
    });
    this._currentMock = new User({ ...this._currentMock, customData });
  }

  public reset(): void {
    this.mock(userMocks.planner);
  }
}
export const userMocker = new UserMocker();
