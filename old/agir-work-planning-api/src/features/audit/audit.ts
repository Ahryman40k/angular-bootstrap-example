import { IAudit, IDate } from '@villemontreal/agir-work-planning-lib/dist/src';

import { systemUser } from '../../services/auditService';
import { userService } from '../../services/userService';
import { GenericEntity } from '../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../shared/logic/guard';
import { Result } from '../../shared/logic/result';
import { MomentUtils } from '../../utils/moment/momentUtils';
import { Author } from './author';
import { IAuditAttributes } from './mongo/auditSchema';

export interface IAuditProps extends IAudit {
  createdBy: Author;
  createdAt: IDate;
  lastModifiedBy?: Author;
  expiredBy?: Author;
}

export class Audit extends GenericEntity<IAuditProps> {
  public static create(props: IAuditProps): Result<Audit> {
    const guardResult = this.guard(props);
    if (!guardResult.succeeded) {
      return Result.fail<Audit>(guardResult);
    }
    return Result.ok<Audit>(new Audit(props));
  }

  public static fromCreateContext(): Audit {
    return Audit.create({
      createdAt: MomentUtils.now().toISOString(),
      createdBy: this.getAuthor()
    }).getValue();
  }

  public static fromUpdateContext(audit: Audit): Audit {
    return Audit.create({
      createdAt: audit.createdAt,
      createdBy: audit.createdBy,
      lastModifiedAt: MomentUtils.now().toISOString(),
      lastModifiedBy: this.getAuthor()
    }).getValue();
  }

  public static getAuthor(): Author {
    const user = userService.currentUser;
    // TODO how to set a user in migration to not use system user ?
    const authorProps = {
      userName: user?.userName ? user?.userName : systemUser.userName,
      displayName: user?.name ? user?.name : systemUser.displayName
    };
    return Author.create(authorProps).getValue();
  }

  public static guard(props: IAuditProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.createdAt,
        argumentName: 'audit.createdAt',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.createdBy,
        argumentName: 'audit.createdBy',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public static async toDomainModel(raw: IAuditAttributes): Promise<Audit> {
    const createdBy = await Author.toDomainModel(raw.createdBy);
    let lastModifiedBy: Author;
    if (raw.lastModifiedBy) {
      lastModifiedBy = await Author.toDomainModel(raw.lastModifiedBy);
    }
    let expiredBy: Author;
    if (raw.expiredBy) {
      expiredBy = await Author.toDomainModel(raw.expiredBy);
    }
    return Audit.create({
      createdBy,
      createdAt: raw.createdAt,
      lastModifiedBy,
      lastModifiedAt: raw.lastModifiedAt,
      expiredBy,
      expiredAt: raw.expiredAt
    }).getValue();
  }

  public static toPersistance(audit: Audit): IAuditAttributes {
    return {
      createdAt: audit.createdAt,
      createdBy: Author.toPersistance(audit.createdBy),
      lastModifiedAt: audit.lastModifiedAt,
      lastModifiedBy: audit.lastModifiedBy ? Author.toPersistance(audit.lastModifiedBy) : undefined,
      expiredAt: audit.expiredAt,
      expiredBy: audit.expiredBy ? Author.toPersistance(audit.expiredBy) : undefined
    };
  }

  // Used only when in need of create an instance from a non refactored class
  // eg Project and Intervention
  public static generateAuditFromIAudit(iAudit: IAudit): Audit {
    const [createdBy, lastModifiedBy, expiredBy] = [iAudit.createdBy, iAudit.lastModifiedBy, iAudit.expiredBy].map(
      by => {
        if (by && by.userName && by.displayName) {
          return Author.create({
            userName: by.userName,
            displayName: by.displayName
          }).getValue();
        }
        return undefined;
      }
    );
    return Audit.create({
      createdBy,
      createdAt: iAudit.createdAt,
      lastModifiedAt: iAudit.lastModifiedAt,
      lastModifiedBy,
      expiredBy
    }).getValue();
  }

  public get createdAt(): IDate {
    return this.props.createdAt;
  }

  public get createdBy(): Author {
    return this.props.createdBy;
  }

  public get lastModifiedAt(): IDate {
    return this.props.lastModifiedAt;
  }

  public get lastModifiedBy(): Author {
    return this.props.lastModifiedBy;
  }

  public get expiredAt(): IDate {
    return this.props.expiredAt;
  }

  public get expiredBy(): Author {
    return this.props.expiredBy;
  }
}

export const isAudit = (v: any): v is Audit => {
  return v instanceof Audit;
};
