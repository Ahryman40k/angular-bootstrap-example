import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { IImportErrorProps, IImportErrorValues, ImportError } from '../../../shared/import/importError';
import { IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { IRtuImportErrorAttributes } from '../mongo/rtuImportLogModel';

export enum RtuImportTarget {
  SESSION = 'session',
  PROJECTS = 'projects',
  DATABASE = 'database',
  PLACES = 'places',
  CONTACT = 'contact',
  AREA_ID = 'areaId'
}

export interface IRtuImportErrorProps extends IImportErrorProps {
  target: RtuImportTarget | string;
}

export class RtuImportError extends AggregateRoot<IRtuImportErrorProps> {
  public static create(props: IRtuImportErrorProps, id?: string): Result<RtuImportError> {
    const guard = ImportError.guard(props);
    if (!guard.succeeded) {
      return Result.fail<RtuImportError>(guard);
    }
    const rtuImportError = new RtuImportError(props, id);
    return Result.ok<RtuImportError>(rtuImportError);
  }

  public static async toDomainModel(raw: IRtuImportErrorAttributes): Promise<RtuImportError> {
    return RtuImportError.create({
      code: raw.code,
      target: raw.target,
      values: raw.values
    }).getValue();
  }

  public static toPersistance(rtuImportError: RtuImportError): IRtuImportErrorAttributes {
    return ImportError.toPersistance(rtuImportError);
  }

  public static fromGuardError(guardResult: IGuardResult, values: IImportErrorValues): RtuImportError {
    if (guardResult.succeeded) {
      return null;
    }
    const rtuImportError = RtuImportError.create({
      code: guardResult.code,
      target: guardResult.target,
      values
    });
    return rtuImportError.getValue();
  }

  public get code(): string {
    return this.props.code;
  }

  public get target(): string {
    return this.props.target;
  }

  public get values(): any {
    return this.props.values;
  }
}
