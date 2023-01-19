import { AssetType, InterventionType, IPriorityLevelCriteria } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, orderBy } from 'lodash';

import { GenericEntity } from '../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import {
  IServicePriorityProps,
  isServicePriority,
  ServicePriority
} from '../../servicePriority/models/servicePriority';
import { IPriorityLevelCriteriaMongoAttributes } from '../mongo/priorityLevelCriteriaSchema';
import {
  IProjectCategoryCriteriaProps,
  isProjectCategoryCriteria,
  ProjectCategoryCriteria
} from './projectCategoryCriteria';

// tslint:disable:no-empty-interface
export interface IPriorityLevelCriteriaProps extends IPriorityLevelCriteria {
  projectCategory?: IProjectCategoryCriteriaProps[];
  servicePriorities?: IServicePriorityProps[];
}

export class PriorityLevelCriteria extends GenericEntity<IPriorityLevelCriteriaProps> {
  public static create(props: IPriorityLevelCriteriaProps): Result<PriorityLevelCriteria> {
    const guardPlain = this.guard(props);
    const guard = Guard.combine([guardPlain]);
    if (!guard.succeeded) {
      return Result.fail<PriorityLevelCriteria>(guard);
    }
    // reorder props
    if (props.projectCategory) {
      props.projectCategory = orderBy(props.projectCategory);
    }
    if (props.workTypeId) {
      props.workTypeId = orderBy(props.workTypeId);
    }
    if (props.requestorId) {
      props.requestorId = orderBy(props.requestorId);
    }
    if (props.assetTypeId) {
      props.assetTypeId = orderBy(props.assetTypeId);
    }
    if (props.interventionType) {
      props.interventionType = orderBy(props.interventionType);
    }
    if (props.servicePriorities) {
      props.servicePriorities = orderBy(props.servicePriorities);
    }

    const priorityLevelCriteria = new PriorityLevelCriteria(props);
    return Result.ok<PriorityLevelCriteria>(priorityLevelCriteria);
  }

  public static guard(props: IPriorityLevelCriteriaProps): IGuardResult {
    let guardProjectCategory = [{ succeeded: true }];
    if (!isEmpty(props.projectCategory)) {
      guardProjectCategory = props.projectCategory.map((pcProps, index) =>
        ProjectCategoryCriteria.guard(pcProps, `[${index}]`)
      );
    }
    let guardWorkTypeId = [{ succeeded: true }];
    if (!isEmpty(props.workTypeId)) {
      guardWorkTypeId = props.workTypeId.map((wt, index) =>
        Guard.guard({
          argument: wt,
          argumentName: `${index}.workTypeId`,
          guardType: [GuardType.EMPTY_STRING]
        })
      );
    }
    let guardRequestorId = [{ succeeded: true }];
    if (!isEmpty(props.requestorId)) {
      guardRequestorId = props.requestorId.map((rq, index) =>
        Guard.guard({
          argument: rq,
          argumentName: `${index}.requestorId`,
          guardType: [GuardType.EMPTY_STRING]
        })
      );
    }
    let guardAssetTypeId = [{ succeeded: true }];
    if (!isEmpty(props.assetTypeId)) {
      guardAssetTypeId = props.assetTypeId.map((at, index) =>
        Guard.guard({
          argument: at,
          argumentName: `${index}.assetTypeId`,
          guardType: [GuardType.IS_ONE_OF],
          values: enumValues(AssetType)
        })
      );
    }
    let guardInterventionType = [{ succeeded: true }];
    if (!isEmpty(props.interventionType)) {
      guardInterventionType = props.interventionType.map((it, index) =>
        Guard.guard({
          argument: it,
          argumentName: `${index}.interventionType`,
          guardType: [GuardType.IS_ONE_OF],
          values: enumValues(InterventionType)
        })
      );
    }

    const guardBulk: IGuardArgument[] = [
      {
        argument: props.servicePriorities,
        argumentName: 'servicePriorities',
        guardType: [GuardType.IS_ARRAY]
      }
    ];
    let guardServicePriorities: IGuardResult[] = [{ succeeded: true }];
    if (!isEmpty(props.servicePriorities)) {
      guardServicePriorities = props.servicePriorities.map((spProps, index) =>
        ServicePriority.guard(spProps, `[${index}]`)
      );
    }
    return Guard.combine([
      ...guardProjectCategory,
      ...guardWorkTypeId,
      ...guardRequestorId,
      ...guardAssetTypeId,
      ...guardInterventionType,
      ...Guard.guardBulk(guardBulk),
      ...guardServicePriorities
    ]);
  }

  public static async toDomainModel(raw: IPriorityLevelCriteriaMongoAttributes): Promise<PriorityLevelCriteria> {
    let servicePriorities: ServicePriority[] = [];
    let projectCategory: ProjectCategoryCriteria[] = [];
    if (!isEmpty(raw.servicePriorities)) {
      servicePriorities = await Promise.all(
        raw.servicePriorities.map(sp => {
          return ServicePriority.toDomainModel(sp);
        })
      );
    }
    if (!isEmpty(raw.projectCategory)) {
      projectCategory = await Promise.all(
        raw.projectCategory.map(pc => {
          return ProjectCategoryCriteria.toDomainModel(pc);
        })
      );
    }
    return PriorityLevelCriteria.create({
      projectCategory,
      workTypeId: raw.workTypeId,
      requestorId: raw.requestorId,
      assetTypeId: raw.assetTypeId,
      interventionType: raw.interventionType,
      servicePriorities
    }).getValue();
  }

  public static toPersistence(priorityLevelCriteria: PriorityLevelCriteria): IPriorityLevelCriteriaMongoAttributes {
    return {
      projectCategory: priorityLevelCriteria.projectCategory.map(pc => ProjectCategoryCriteria.toPersistance(pc)),
      workTypeId: priorityLevelCriteria.workTypeId,
      requestorId: priorityLevelCriteria.requestorId,
      assetTypeId: priorityLevelCriteria.assetTypeId,
      interventionType: priorityLevelCriteria.interventionType,
      servicePriorities: priorityLevelCriteria.servicePriorities.map(sp => ServicePriority.toPersistance(sp))
    };
  }

  public static getDefault(): PriorityLevelCriteria {
    return PriorityLevelCriteria.create({
      projectCategory: [ProjectCategoryCriteria.getDefault()]
    }).getValue();
  }

  private readonly _servicePriority: ServicePriority[] = [];
  private readonly _projectCategoryCriteria: ProjectCategoryCriteria[] = [];
  constructor(props: IPriorityLevelCriteriaProps) {
    super(props);
    if (!isEmpty(props.servicePriorities)) {
      this._servicePriority = props.servicePriorities.map(sp =>
        isServicePriority(sp) ? sp : ServicePriority.create(sp).getValue()
      );
    }

    if (!isEmpty(props.projectCategory)) {
      this._projectCategoryCriteria = props.projectCategory.map(pc =>
        isProjectCategoryCriteria(pc) ? pc : ProjectCategoryCriteria.create(pc).getValue()
      );
    }
  }

  public get projectCategory(): ProjectCategoryCriteria[] {
    return this._projectCategoryCriteria;
  }

  public get workTypeId(): string[] {
    return this.props.workTypeId;
  }

  public get requestorId(): string[] {
    return this.props.requestorId;
  }

  public get assetTypeId(): string[] {
    return this.props.assetTypeId;
  }

  public get interventionType(): string[] {
    return this.props.interventionType;
  }

  public get servicePriorities(): ServicePriority[] {
    return this._servicePriority;
  }

  public equals(otherPriorityLevelCriteria: PriorityLevelCriteria): boolean {
    return this.innerEquals(otherPriorityLevelCriteria);
  }

  private innerEquals(otherPriorityLevelCriteria: PriorityLevelCriteria): boolean {
    return (
      this.projectCategory === otherPriorityLevelCriteria.projectCategory &&
      this.workTypeId === otherPriorityLevelCriteria.workTypeId &&
      this.requestorId === otherPriorityLevelCriteria.requestorId &&
      this.assetTypeId === otherPriorityLevelCriteria.assetTypeId &&
      this.interventionType === otherPriorityLevelCriteria.interventionType &&
      this.servicePriorities === otherPriorityLevelCriteria.servicePriorities
    );
  }
}

export const isPriorityLevelCriteria = (v: any): v is PriorityLevelCriteria => {
  return v instanceof PriorityLevelCriteria;
};
