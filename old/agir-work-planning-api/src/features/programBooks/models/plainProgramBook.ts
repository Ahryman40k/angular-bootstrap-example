import {
  IPlainProgramBook,
  ProgramBookStatus,
  ProjectType,
  Role
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';

// tslint:disable:no-empty-interface
export interface IPlainProgramBookProps extends IPlainProgramBook {
  projectTypes: ProjectType[];
  programTypes?: string[];
  sharedRoles?: Role[];
  status: ProgramBookStatus;
}

export class PlainProgramBook<P extends IPlainProgramBookProps> extends AggregateRoot<P> {
  public static create(props: IPlainProgramBookProps): Result<PlainProgramBook<IPlainProgramBookProps>> {
    const guardPlain = PlainProgramBook.guard(props);
    const guard = Guard.combine([guardPlain]);
    if (!guard.succeeded) {
      return Result.fail<PlainProgramBook<IPlainProgramBookProps>>(guard);
    }
    const plainProgramBook = new PlainProgramBook(props);
    return Result.ok<PlainProgramBook<IPlainProgramBookProps>>(plainProgramBook);
  }

  public static guard(props: IPlainProgramBookProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.name,
        argumentName: 'name',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.projectTypes,
        argumentName: 'projectTypes',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_ARRAY, GuardType.IS_ONE_OF],
        values: enumValues(ProjectType)
      },
      {
        argument: props.inCharge,
        argumentName: 'inCharge',
        guardType: [GuardType.EMPTY_STRING]
      },
      {
        argument: props.boroughIds,
        argumentName: 'boroughIds',
        guardType: [GuardType.EMPTY_ARRAY]
      },
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(ProgramBookStatus)
      },
      {
        argument: props.programTypes,
        argumentName: 'programTypes',
        guardType: [GuardType.IS_ARRAY]
      }
    ];
    let guardProjectTypes = { succeeded: true };
    let guardProgramTypesLength = { succeeded: true };
    if (!isEmpty(props.projectTypes) && props.projectTypes.includes(ProjectType.nonIntegrated)) {
      guardProjectTypes = Guard.guard({
        argument: props.projectTypes,
        argumentName: 'projectTypes',
        guardType: [GuardType.MAX_LENGTH],
        values: [1]
      });
      guardProgramTypesLength = Guard.guard({
        argument: props.programTypes,
        argumentName: 'programTypes',
        guardType: [GuardType.MIN_LENGTH],
        values: [1]
      });
    }
    let guardSharedRoles = { succeeded: true };
    if (!isEmpty(props.sharedRoles)) {
      guardSharedRoles = Guard.guard({
        argument: props.sharedRoles,
        argumentName: 'sharedRoles',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(Role)
      });
    }
    let guardProgramTypes = { succeeded: true };
    if (!isEmpty(props.programTypes)) {
      guardProgramTypes = Guard.guard({
        argument: props.projectTypes,
        argumentName: 'projectTypes',
        guardType: [GuardType.IS_ONE_OF],
        values: [ProjectType.nonIntegrated]
      });
    }

    return Guard.combine([
      ...Guard.guardBulk(guardBulk),
      guardSharedRoles,
      guardProgramTypes,
      guardProjectTypes,
      guardProgramTypesLength
    ]);
  }

  constructor(props: P, id: string = null) {
    super(props, id);
    if (isEmpty(props.sharedRoles)) {
      this.props.sharedRoles = [];
    }
  }

  public get name(): string {
    return this.props.name;
  }

  public get projectTypes(): ProjectType[] {
    return this.props.projectTypes;
  }

  public get inCharge(): string {
    return this.props.inCharge;
  }

  public get boroughIds(): string[] {
    return this.props.boroughIds;
  }

  public get sharedRoles(): Role[] {
    return this.props.sharedRoles;
  }

  public get status(): ProgramBookStatus {
    return this.props.status;
  }

  public get programTypes(): string[] {
    return this.props.programTypes;
  }

  public get description(): string {
    return this.props.description;
  }

  public setSharedRoles(sharedRoles: Role[]) {
    this.props.sharedRoles = sharedRoles;
  }

  public setStatus(status: ProgramBookStatus) {
    this.props.status = status;
  }

  public equals(otherPlainProgramBook: PlainProgramBook<any>): boolean {
    return super.equals(otherPlainProgramBook) && this.innerEquals(otherPlainProgramBook);
  }

  private innerEquals(otherPlainProgramBook: PlainProgramBook<any>): boolean {
    return (
      this.name === otherPlainProgramBook.name &&
      this.projectTypes === otherPlainProgramBook.projectTypes &&
      this.inCharge === otherPlainProgramBook.inCharge &&
      this.boroughIds === otherPlainProgramBook.boroughIds &&
      this.programTypes === otherPlainProgramBook.programTypes
    );
  }
}
