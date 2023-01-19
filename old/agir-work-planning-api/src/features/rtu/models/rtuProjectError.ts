import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { IRtuProjectErrorAttributes } from '../mongo/rtuImportLogModel';
import { RtuImportError } from './rtuImportError';

export interface IRtuProjectErrorProps {
  projectId: string;
  projectNoReference: string;
  projectName: string;
  streetName: string;
  streetFrom: string;
  streetTo: string;
  errorDetails: RtuImportError[];
}

export class RtuProjectError extends AggregateRoot<IRtuProjectErrorProps> {
  public static create(props: IRtuProjectErrorProps, id?: string): Result<RtuProjectError> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<RtuProjectError>(guard);
    }
    const rtuProjectError = new RtuProjectError(props, id);
    return Result.ok<RtuProjectError>(rtuProjectError);
  }

  public static guard(props: IRtuProjectErrorProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.projectId,
        argumentName: 'projectId',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);

    return Guard.combine([...guardBulkResult]);
  }

  public static async toDomainModel(raw: IRtuProjectErrorAttributes): Promise<RtuProjectError> {
    const errorDetails = await Promise.all(
      raw.errorDetails.map(async errorDetail => RtuImportError.toDomainModel(errorDetail))
    );
    return RtuProjectError.create({
      projectId: raw.projectId,
      projectNoReference: raw.projectNoReference,
      projectName: raw.projectName,
      streetName: raw.streetName,
      streetFrom: raw.streetFrom,
      streetTo: raw.streetTo,
      errorDetails
    }).getValue();
  }

  public static toPersistance(rtuProjectError: RtuProjectError): IRtuProjectErrorAttributes {
    return {
      projectId: rtuProjectError.projectId,
      projectNoReference: rtuProjectError.projectNoReference,
      projectName: rtuProjectError.projectName,
      streetName: rtuProjectError.streetName,
      streetFrom: rtuProjectError.streetFrom,
      streetTo: rtuProjectError.streetTo,
      errorDetails: rtuProjectError?.errorDetails?.map(errorDetail => RtuImportError.toPersistance(errorDetail))
    };
  }

  public get projectId(): string {
    return this.props.projectId;
  }

  public get projectNoReference(): string {
    return this.props.projectNoReference;
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

  public get errorDetails(): RtuImportError[] {
    return this.props.errorDetails;
  }
}
