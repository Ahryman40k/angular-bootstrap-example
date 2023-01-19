import { IAuthor } from '@villemontreal/agir-work-planning-lib/dist/src';
import { GenericEntity } from '../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../shared/logic/guard';
import { Result } from '../../shared/logic/result';
import { IAuthorAttributes } from './mongo/authorSchema';

// tslint:disable:no-empty-interface
export interface IAuthorProps extends IAuthor {}

export class Author extends GenericEntity<IAuthorProps> {
  public static create(props: IAuthorProps): Result<Author> {
    const guardResult = this.guard(props);
    if (!guardResult.succeeded) {
      return Result.fail<Author>(guardResult);
    }
    return Result.ok<Author>(new Author(props));
  }

  public static guard(props: IAuthorProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.userName,
        argumentName: 'userName',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.displayName,
        argumentName: 'displayName',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public static async toDomainModel(raw: IAuthorAttributes): Promise<Author> {
    return Author.create(raw).getValue();
  }

  public static toPersistance(author: Author): IAuthorAttributes {
    return {
      userName: author.userName,
      displayName: author.displayName
    };
  }

  public get userName(): string {
    return this.props.userName;
  }

  public get displayName(): string {
    return this.props.displayName;
  }
}
