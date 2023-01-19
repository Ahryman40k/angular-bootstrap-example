import { AggregateRoot } from '../../../../shared/domain/aggregateRoot';
import { ExternalReferenceId } from '../../../../shared/domain/externalReferenceId/externalReferenceId';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { enumValues } from '../../../../utils/enumUtils';
import { IRtuProjectExportAttributes } from '../../mongo/rtuExportLogModel';
import { RtuExportError } from '../rtuExportError';
import { RtuProjectExportStatus } from './rtuProjectExport';

export interface IRtuProjectExportSummaryProps {
  status?: RtuProjectExportStatus;
  projectName?: string;
  streetName?: string;
  streetFrom?: string;
  streetTo?: string;
  infoRtuId?: string;
  externalReferenceIds?: ExternalReferenceId[];
  errorDetails?: RtuExportError[];
}

export class RtuProjectExportSummary extends AggregateRoot<IRtuProjectExportSummaryProps> {
  public static create(props: IRtuProjectExportSummaryProps, id: string): Result<RtuProjectExportSummary> {
    // Guard id
    const guardId = Guard.guard({
      argument: id,
      argumentName: 'id',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
    });
    const guardProps = this.guard(props);
    const guardResult = Guard.combine([guardId, guardProps]);
    if (!guardResult.succeeded) {
      return Result.fail<RtuProjectExportSummary>(guardResult);
    }
    const rtuProjectExport = new RtuProjectExportSummary(props, id);
    return Result.ok<RtuProjectExportSummary>(rtuProjectExport);
  }

  public static guard(props: IRtuProjectExportSummaryProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(RtuProjectExportStatus)
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);

    return Guard.combine([...guardBulkResult]);
  }

  public static async toDomainModel(raw: IRtuProjectExportAttributes): Promise<RtuProjectExportSummary> {
    let errorDetails: RtuExportError[] = [];
    if (raw.errorDetails) {
      errorDetails = await Promise.all(
        raw.errorDetails.map(async errorDetail => RtuExportError.toDomainModel(errorDetail))
      );
    }
    return RtuProjectExportSummary.create(
      {
        status: raw.status,
        projectName: raw.projectName,
        streetName: raw.streetName,
        streetFrom: raw.streetFrom,
        streetTo: raw.streetTo,
        errorDetails
      },
      raw._id
    ).getValue();
  }

  public static toPersistance(rtuProjectExport: RtuProjectExportSummary): IRtuProjectExportAttributes {
    return {
      _id: rtuProjectExport.id,
      status: rtuProjectExport.status,
      projectName: rtuProjectExport.projectName,
      streetName: rtuProjectExport.streetName,
      streetFrom: rtuProjectExport.streetFrom,
      streetTo: rtuProjectExport.streetTo,
      errorDetails: rtuProjectExport?.errorDetails?.map(errorDetail => RtuExportError.toPersistance(errorDetail))
    };
  }

  public get status(): RtuProjectExportStatus {
    return this.props.status;
  }

  public get projectName(): string {
    return this.props.projectName;
  }

  public get streetName(): string {
    return this.props.streetName;
  }

  public get streetFrom(): string {
    return this.props.streetFrom;
  }

  public get streetTo(): string {
    return this.props.streetTo;
  }

  public get infoRtuId(): string {
    return this.props.infoRtuId;
  }

  public get errorDetails(): RtuExportError[] {
    return this.props.errorDetails;
  }

  public get externalReferenceIds(): ExternalReferenceId[] {
    return this.props.externalReferenceIds;
  }
}
