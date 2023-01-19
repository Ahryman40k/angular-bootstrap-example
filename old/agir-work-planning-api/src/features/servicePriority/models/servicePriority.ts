import { IServicePriority } from '@villemontreal/agir-work-planning-lib/dist/src';

import { GenericEntity } from '../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { IServicePriorityAttributes } from '../mongo/servicePrioritySchema';

// tslint:disable:no-empty-interface
export interface IServicePriorityProps extends IServicePriority {}

export class ServicePriority extends GenericEntity<IServicePriorityProps> {
  public static create(props: IServicePriorityProps): Result<ServicePriority> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ServicePriority>(guard);
    }
    const servicePriority = new ServicePriority(props);
    return Result.ok<ServicePriority>(servicePriority);
  }

  public static guard(props: IServicePriorityProps, valueName = ''): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.service,
        argumentName: `${valueName}service`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.priorityId,
        argumentName: `${valueName}priorityId`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public static async toDomainModel(raw: IServicePriorityAttributes): Promise<ServicePriority> {
    return ServicePriority.create({
      service: raw.service,
      priorityId: raw.priorityId
    }).getValue();
  }

  public static toPersistance(servicePriority: ServicePriority): IServicePriorityAttributes {
    return {
      service: servicePriority.service,
      priorityId: servicePriority.priorityId
    };
  }

  public get service(): string {
    return this.props.service;
  }

  public get priorityId(): string {
    return this.props.priorityId;
  }

  public equals(otherServicePriority: ServicePriority): boolean {
    return this.innerEquals(otherServicePriority);
  }

  private innerEquals(otherServicePriority: ServicePriority): boolean {
    return this.service === otherServicePriority.service && this.priorityId === otherServicePriority.priorityId;
  }
}

export const isServicePriority = (v: any): v is ServicePriority => {
  return v instanceof ServicePriority;
};
