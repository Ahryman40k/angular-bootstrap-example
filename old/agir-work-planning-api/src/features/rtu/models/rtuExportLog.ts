import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { Audit } from '../../audit/audit';
import { Auditable, IAuditableProps } from '../../audit/auditable';
import { RtuExportError, RtuExportTarget } from './rtuExportError';
import { RtuProjectExport, RtuProjectExportStatus } from './rtuProjectExport/rtuProjectExport';
import { RtuProjectExportSummary } from './rtuProjectExport/rtuProjectExportSummary';

export enum RtuExportStatus {
  SUCCESSFUL = 'successful',
  IN_PROGRESS = 'inProgress',
  FAILURE = 'failure'
}

export interface IRtuExportLogProps extends IAuditableProps {
  startDateTime: string | Date;
  endDateTime?: string | Date;
  status: RtuExportStatus;
  errorDetail?: RtuExportError;
  projects?: RtuProjectExportSummary[];
}

export class RtuExportLog extends Auditable(AggregateRoot)<IRtuExportLogProps> {
  public static create(props: IRtuExportLogProps, id?: string): Result<RtuExportLog> {
    const guard = this.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guardResult = Guard.combine([guard, guardAudit]);
    if (!guardResult.succeeded) {
      return Result.fail<RtuExportLog>(guardResult);
    }
    const rtuExportLog = new RtuExportLog(props, id);
    return Result.ok<RtuExportLog>(rtuExportLog);
  }

  public static guard(props: IRtuExportLogProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(RtuExportStatus)
      },
      {
        argument: props.startDateTime,
        argumentName: 'startDateTime',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_DATE]
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);
    return Guard.combine([...guardBulkResult]);
  }

  public get status(): RtuExportStatus {
    if (this.errorDetail) {
      return RtuExportStatus.FAILURE;
    }
    if (this.projects?.some(project => project.status === RtuProjectExportStatus.FAILURE)) {
      const rtuExportErrorResult = RtuExportError.create({
        code: ErrorCode.INVALID,
        target: RtuExportTarget.PROJECTS,
        values: { value1: this.projects.filter(value => value.status === RtuProjectExportStatus.FAILURE).length }
      });
      this.errorDetail = rtuExportErrorResult.getValue();
      return RtuExportStatus.FAILURE;
    }
    return this.props.status;
  }

  public set status(value: RtuExportStatus) {
    this.props.status = value;
  }

  public get startDateTime(): Date {
    return this.getDateFromProperty(this.props.startDateTime);
  }
  public get endDateTime(): Date {
    return this.getDateFromProperty(this.props.endDateTime);
  }
  public set endDateTime(value: Date) {
    this.props.endDateTime = value;
  }
  public get errorDetail(): RtuExportError {
    return this.props.errorDetail;
  }
  public set errorDetail(value: RtuExportError) {
    this.props.errorDetail = value;
  }
  public get projects(): RtuProjectExportSummary[] {
    return this.props.projects;
  }
  public addProjectResultSummary(result: Result<RtuProjectExportSummary>) {
    if (result.isSuccess) {
      this.props.projects.push(result.getValue());
    } else {
      this.props.projects.push(result.errorValue() as any);
    }
  }

  public addProjectResultInfoRtu(result: Result<RtuProjectExport>) {
    if (result.isSuccess) {
      const project = result.getValue();
      this.props.projects.push(
        RtuProjectExport.toProjectExportSummary(project.id, {
          projectName: project.name,
          streetName: project.rueSur,
          streetFrom: project.rueDe,
          streetTo: project.rueA
        })
      );
    } else {
      this.props.projects.push(result.errorValue() as any);
    }
  }

  public setEndDateTime(): void {
    this.props.endDateTime = new Date();
  }

  private getDateFromProperty(prop: string | Date): Date {
    if (!prop || prop instanceof Date) {
      return prop as Date;
    }
    return new Date(prop);
  }
}
