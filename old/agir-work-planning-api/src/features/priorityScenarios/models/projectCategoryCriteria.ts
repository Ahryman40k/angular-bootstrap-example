import {
  IProjectCategoryCriteria,
  ProjectCategory,
  ProjectSubCategory
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { GenericEntity } from '../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { IProjectCategoryCriteriaMongoAttributes } from '../mongo/projectCategoryCriteriaSchema';

// tslint:disable:no-empty-interface
export interface IProjectCategoryCriteriaProps extends IProjectCategoryCriteria {}

export class ProjectCategoryCriteria extends GenericEntity<IProjectCategoryCriteriaProps> {
  public static create(props: IProjectCategoryCriteriaProps): Result<ProjectCategoryCriteria> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ProjectCategoryCriteria>(guard);
    }
    const projectCategoryCriteria = new ProjectCategoryCriteria(props);
    return Result.ok<ProjectCategoryCriteria>(projectCategoryCriteria);
  }

  public static guard(props: IProjectCategoryCriteriaProps, valueName = ''): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.subCategory,
        argumentName: `${valueName}subCategory`,
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(ProjectSubCategory)
      },
      {
        argument: props.category,
        argumentName: `${valueName}category`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(ProjectCategory)
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public static async toDomainModel(raw: IProjectCategoryCriteriaMongoAttributes): Promise<ProjectCategoryCriteria> {
    return ProjectCategoryCriteria.create({
      category: raw.category,
      subCategory: raw.subCategory
    }).getValue();
  }

  public static toPersistance(
    projectCategoryCriteria: ProjectCategoryCriteria
  ): IProjectCategoryCriteriaMongoAttributes {
    return {
      category: projectCategoryCriteria.category,
      subCategory: projectCategoryCriteria.subCategory
    };
  }

  public static getDefault(): ProjectCategoryCriteria {
    return ProjectCategoryCriteria.create({
      category: ProjectCategory.completing
    }).getValue();
  }

  public get category(): string {
    return this.props.category;
  }

  public get subCategory(): string {
    return this.props.subCategory;
  }

  public equals(otherProjectCategoryCriteria: ProjectCategoryCriteria): boolean {
    return this.innerEquals(otherProjectCategoryCriteria);
  }

  private innerEquals(otherProjectCategoryCriteria: ProjectCategoryCriteria): boolean {
    return (
      this.category === otherProjectCategoryCriteria.category &&
      this.subCategory === otherProjectCategoryCriteria.subCategory
    );
  }
}

export const isProjectCategoryCriteria = (v: any): v is ProjectCategoryCriteria => {
  return v instanceof ProjectCategoryCriteria;
};
