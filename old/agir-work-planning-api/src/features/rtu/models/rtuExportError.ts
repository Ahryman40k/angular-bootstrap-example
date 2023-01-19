import { IImportErrorProps, ImportError } from '../../../shared/import/importError';
import { Result } from '../../../shared/logic/result';
import { IRtuExportErrorAttributes } from '../mongo/rtuExportLogModel';

export enum RtuExportTarget {
  SESSION = 'session',
  PROJECTS = 'projects',
  DATABASE = 'database',
  INFO_RTU_API = 'infoRtuApi',
  GEOMETRY = 'geometry',
  FIND_TYPE = 'findType',
  CONTACT = 'contact'
}

export interface IRtuExportErrorProps extends IImportErrorProps {
  target: RtuExportTarget | string;
}

export class RtuExportError extends ImportError<IRtuExportErrorProps> {
  public static create(props: IRtuExportErrorProps, id?: string): Result<RtuExportError> {
    const guard = ImportError.guard(props);
    if (!guard.succeeded) {
      return Result.fail<RtuExportError>(guard);
    }
    const rtuImportError = new RtuExportError(props, id);
    return Result.ok<RtuExportError>(rtuImportError);
  }

  public static async toDomainModel(raw: IRtuExportErrorAttributes): Promise<RtuExportError> {
    return RtuExportError.create({
      code: raw.code,
      target: raw.target,
      values: raw.values
    }).getValue();
  }

  public static toPersistance(rtuImportError: RtuExportError): IRtuExportErrorAttributes {
    return ImportError.toPersistance(rtuImportError);
  }
}
