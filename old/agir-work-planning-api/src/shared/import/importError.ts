import { AggregateRoot } from '../domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../logic/guard';
import { IImportErrorAttributes } from './importErrorSchema';

export interface IImportErrorValues {
  value1: any;
  value2?: any;
  value3?: any;
}
export interface IImportErrorProps {
  code: string; // TODO merge all ErrorCode and ErrorCodes from lib to type attribute
  target: string;
  values?: IImportErrorValues;
}

export abstract class ImportError<T extends IImportErrorProps> extends AggregateRoot<T> {
  public static guard(props: IImportErrorProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.code,
        argumentName: 'code',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.target,
        argumentName: 'target',
        guardType: [GuardType.NULL_OR_UNDEFINED]
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);

    return Guard.combine([...guardBulkResult]);
  }

  public static toPersistance(importError: ImportError<IImportErrorProps>): IImportErrorAttributes {
    return {
      code: importError.code,
      target: importError.target,
      values: importError.values
    };
  }

  public get code(): string {
    return this.props.code;
  }

  public get target(): string {
    return this.props.target;
  }

  public get values(): IImportErrorValues {
    return this.props.values;
  }
}
