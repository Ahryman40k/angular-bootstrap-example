import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../logic/guard';
import { Result } from '../../logic/result';
import { AggregateRoot } from '../aggregateRoot';
import { IExternalReferenceIdAttributes } from './externalReferenceIdSchema';

export interface IExternalReferenceIdProps {
  type: string;
  value: string;
}

export class ExternalReferenceId extends AggregateRoot<IExternalReferenceIdProps> {
  public static create(props: IExternalReferenceIdProps): Result<ExternalReferenceId> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ExternalReferenceId>(guard);
    }
    const externalReferenceId = new ExternalReferenceId(props, null);
    return Result.ok<ExternalReferenceId>(externalReferenceId);
  }

  public static guard(props: IExternalReferenceIdProps, valueName = ''): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.type,
        argumentName: `${valueName}type`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.value,
        argumentName: `${valueName}value`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public static async toDomainModel(raw: IExternalReferenceIdAttributes): Promise<ExternalReferenceId> {
    return ExternalReferenceId.create({
      type: raw.type,
      value: raw.value
    }).getValue();
  }

  public static toPersistance(externalReferenceId: ExternalReferenceId): IExternalReferenceIdAttributes {
    return {
      type: externalReferenceId.type,
      value: externalReferenceId.value
    };
  }

  public get type(): string {
    return this.props.type;
  }

  public get value(): string {
    return this.props.value;
  }

  public set value(value: string) {
    this.props.value = value;
  }

  public equals(otherExternalReferenceId: ExternalReferenceId): boolean {
    return super.equals(otherExternalReferenceId) && this.innerEquals(otherExternalReferenceId);
  }

  private innerEquals(otherExternalReferenceId: ExternalReferenceId): boolean {
    return this.type === otherExternalReferenceId.type && this.value === otherExternalReferenceId.value;
  }
}
