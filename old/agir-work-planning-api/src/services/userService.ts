import { User } from '@villemontreal/agir-work-planning-lib';
import * as cls from 'cls-hooked';
import { get, mergeWith } from 'lodash';
import { configs } from '../../config/configs';
import { userMocker } from '../../tests/utils/userUtils';
import { IRestriction } from '../shared/restrictions/userRestriction';
import { mergeArrays } from '../utils/arrayUtils';

export interface IUserService {
  /**
   * Gets the current user.
   */
  readonly currentUser: User;

  /**
   * Gets user restrictions.
   */
  restrictions: IRestriction;

  /**
   * Executes a function inside a context where the current user is defined.
   *
   * @param work the function to run within the user context.
   * @param user the user to use.
   *
   */
  withUser(work: () => void, user: User): void;
}

const STORE_NAMESPACE_ID = '5d710b43-0168-411e-8c95-44f6eb71f0c3';
const STORE_USER_KEY = 'user';

class UserService implements IUserService {
  private readonly store: cls.Namespace = cls.createNamespace(STORE_NAMESPACE_ID);

  public get currentUser(): User {
    if (configs.testingMode) {
      return new User(userMocker.currentMock);
    }
    return new User(this.store.get(STORE_USER_KEY));
  }

  public withUser(work: () => void, user: User): void {
    this.store.run(() => {
      this.store.set(STORE_USER_KEY, user);
      work();
    });
  }

  public get restrictions(): IRestriction {
    let restrictions: IRestriction = {};
    for (const data of this.currentUser?.customData || []) {
      restrictions = mergeWith(restrictions, get(data, 'restrictions', {}), mergeArrays);
    }
    return restrictions;
  }
}

export const userService: IUserService = new UserService();
