import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { Audit } from '../../audit/audit';
import { Auditable, IAuditableProps } from '../../audit/auditable';
import { RtuImportError } from './rtuImportError';
import { RtuProjectError } from './rtuProjectError';

export enum RtuImportStatus {
  SUCCESSFUL = 'successful',
  FAILURE = 'failure'
}

export interface IRtuImportLogProps extends IAuditableProps {
  startDateTime: string | Date;
  endDateTime: string | Date;
  status?: RtuImportStatus;
  errorDetail?: RtuImportError;
  failedProjects?: RtuProjectError[];
}

export class RtuImportLog extends Auditable(AggregateRoot)<IRtuImportLogProps> {
  public static create(props: IRtuImportLogProps, id?: string): Result<RtuImportLog> {
    const guard = this.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guardResult = Guard.combine([guard, guardAudit]);
    if (!guardResult.succeeded) {
      return Result.fail<RtuImportLog>(guardResult);
    }
    const rtuImportLog = new RtuImportLog(props, id);
    return Result.ok<RtuImportLog>(rtuImportLog);
  }

  public static guard(props: IRtuImportLogProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(RtuImportStatus)
      },
      {
        argument: props.startDateTime,
        argumentName: 'startDateTime',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_DATE]
      },
      {
        argument: props.endDateTime,
        argumentName: 'endDateTime',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_DATE]
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);
    return Guard.combine([...guardBulkResult]);
  }

  public get status(): RtuImportStatus {
    if (this.errorDetail) {
      return RtuImportStatus.FAILURE;
    }
    return this.props.status;
  }

  public get startDateTime(): Date {
    return this.getDateFromProperty(this.props.startDateTime);
  }
  public get endDateTime(): Date {
    return this.getDateFromProperty(this.props.endDateTime);
  }
  public get errorDetail(): RtuImportError {
    return this.props.errorDetail;
  }
  public get failedProjects(): RtuProjectError[] {
    return this.props.failedProjects;
  }

  private getDateFromProperty(prop: string | Date): Date {
    return prop instanceof Date ? prop : new Date(prop);
  }
}
