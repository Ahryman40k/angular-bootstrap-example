import { IAuthor } from '@villemontreal/agir-work-planning-lib';

// tslint:disable:no-empty-interface
export interface IAuthorAttributes extends IAuthor {}

export const authorSchema = {
  userName: String,
  displayName: String
};
