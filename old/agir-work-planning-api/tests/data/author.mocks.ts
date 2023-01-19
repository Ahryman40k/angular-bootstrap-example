import { IAuthor } from '@villemontreal/agir-work-planning-lib/dist/src';

import { userMocker } from '../utils/userUtils';

export function createAuthorMock(partial?: Partial<IAuthor>): IAuthor {
  const user = userMocker.currentMock;
  return {
    userName: user.userName,
    displayName: user.displayName
  };
}
