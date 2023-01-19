import { IImportErrorProps, IImportErrorValues, ImportError } from '../../../shared/import/importError';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { INexoFileErrorAttributes } from '../mongo/nexoImportLogModel';

export interface INexoFileErrorProps extends IImportErrorProps {
  target: string;
  line?: number;
}

export class NexoFileError extends ImportError<INexoFileErrorProps> {
  public static create(props: INexoFileErrorProps, id?: string): Result<NexoFileError> {
    const guardBase = ImportError.guard(props);
    const guard = this.guard(props);
    const guardResult = Guard.combine([guardBase, guard]);
    if (!guardResult.succeeded) {
      return Result.fail<NexoFileError>(guardResult);
    }
    const nexoImportFile = new NexoFileError(props, id);
    return Result.ok<NexoFileError>(nexoImportFile);
  }

  public static guard(props: INexoFileErrorProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.line,
        argumentName: 'line',
        guardType: [GuardType.IS_POSITIVE_INTEGER]
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);

    return Guard.combine([...guardBulkResult]);
  }

  public static async toDomainModel(raw: INexoFileErrorAttributes): Promise<NexoFileError> {
    return NexoFileError.create({
      code: raw.code,
      target: raw.target,
      values: raw.values,
      line: raw.line
    }).getValue();
  }

  public static toPersistance(nexoFileError: NexoFileError): INexoFileErrorAttributes {
    return {
      ...ImportError.toPersistance(nexoFileError),
      line: nexoFileError.line
    };
  }

  public static fromGuardError(
    guardResult: IGuardResult,
    values: IImportErrorValues,
    line: number,
    id: string
  ): NexoFileError {
    if (guardResult.succeeded) {
      return null;
    }
    const fileError = NexoFileError.create(
      {
        code: guardResult.code,
        target: guardResult.target,
        line,
        values
      },
      id
    );
    return fileError.getValue();
  }

  public get line(): number {
    return this.props.line;
  }
}
