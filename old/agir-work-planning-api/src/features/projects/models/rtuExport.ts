import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { RtuProjectExportStatus } from '../../rtu/models/rtuProjectExport/rtuProjectExport';
import { IRtuExportMongoAttributes } from '../mongo/projectModel';

export interface IRtuExportProps {
  status?: string;
  exportAt?: string;
}

export class RtuExport extends AggregateRoot<IRtuExportProps> {
  public static create(props: IRtuExportProps, id?: string): Result<RtuExport> {
    const guardResult = this.guard(props);
    if (!guardResult.succeeded) {
      return Result.fail<RtuExport>(guardResult);
    }
    const rtuExportLog = new RtuExport(props, id);
    return Result.ok<RtuExport>(rtuExportLog);
  }

  public static guard(props: IRtuExportProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(RtuProjectExportStatus)
      },
      {
        argument: props.exportAt,
        argumentName: 'exportAt',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_DATE]
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);
    return Guard.combine([...guardBulkResult]);
  }

  public static async toDomainModel(raw: IRtuExportMongoAttributes): Promise<RtuExport> {
    return RtuExport.create({
      status: raw.status,
      exportAt: raw.exportAt
    }).getValue();
  }

  public static toPersistance(rtuExport: RtuExport): IRtuExportMongoAttributes {
    return {
      exportAt: rtuExport.exportAt,
      status: rtuExport.status
    };
  }

  public get status(): string {
    return this.props.status;
  }
  public get exportAt(): string {
    return this.props.exportAt;
  }
}
