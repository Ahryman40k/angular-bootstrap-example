import {
  IBudget,
  IGeometry,
  IPlainProject,
  IPlainProjectAnnualDistributionSummary
} from '@villemontreal/agir-work-planning-lib';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import {
  ExternalReferenceId,
  IExternalReferenceIdProps
} from '../../../shared/domain/externalReferenceId/externalReferenceId';
import { Guard, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { isEmpty } from '../../../utils/utils';
import { IProjectAnnualPeriodProps, ProjectAnnualPeriod } from '../../annualPeriods/models/projectAnnualPeriod';
import { IServicePriorityProps, ServicePriority } from '../../servicePriority/models/servicePriority';

export interface IPlainProjectProps extends IPlainProject {
  externalReferenceIds?: IExternalReferenceIdProps[];
  servicePriorities?: IServicePriorityProps[];
  annualPeriods?: IProjectAnnualPeriodProps[];
}

export class PlainProject<P extends IPlainProjectProps> extends AggregateRoot<P> {
  public static create(props: IPlainProjectProps): Result<PlainProject<IPlainProjectProps>> {
    if (!props) {
      return Result.fail<PlainProject<IPlainProjectProps>>(`Empty body`);
    }
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<PlainProject<IPlainProjectProps>>(guard);
    }
    const plainIntervention = new PlainProject(props);
    return Result.ok<PlainProject<IPlainProjectProps>>(plainIntervention);
  }

  // TODO set up project guards
  public static guard(props: IPlainProjectProps): IGuardResult {
    const guard = { succeeded: true };
    let guardServicePriorities = [{ succeeded: true }];
    if (!isEmpty(props.servicePriorities)) {
      guardServicePriorities = props.servicePriorities.map(sp => ServicePriority.guard(sp));
    }
    return Guard.combine([guard, ...guardServicePriorities]);
  }

  public get externalReferenceIds(): ExternalReferenceId[] {
    return this._externalReferenceIds;
  }

  public get boroughId(): string {
    return this.props.boroughId;
  }

  public get status(): string {
    return this.props.status;
  }

  public get startYear(): number {
    return this.props.startYear;
  }

  public get endYear(): number {
    return this.props.endYear;
  }

  public get executorId(): string {
    return this.props.executorId;
  }

  public get geometry(): IGeometry {
    return this.props.geometry;
  }

  public get globalBudget(): IBudget {
    return this.props.globalBudget;
  }

  public get importFlag(): string {
    return this.props.importFlag;
  }

  public get inChargeId(): string {
    return this.props.inChargeId;
  }

  public get interventionIds(): string[] {
    return this.props.interventionIds;
  }

  public get servicePriorities(): ServicePriority[] {
    return this._servicePriorities;
  }

  public get projectName(): string {
    return this.props.projectName;
  }

  public get projectTypeId(): string {
    return this.props.projectTypeId;
  }

  public get riskId(): string {
    return this.props.riskId;
  }

  public get streetName(): string {
    return this.props.streetName;
  }

  public get subCategoryIds(): string[] {
    return this.props.subCategoryIds;
  }

  public get annualPeriods(): ProjectAnnualPeriod[] {
    return this._annualPeriods;
  }

  public get annualProjectDistributionSummary(): IPlainProjectAnnualDistributionSummary {
    return this.props.annualProjectDistributionSummary;
  }

  private readonly _externalReferenceIds: ExternalReferenceId[] = [];
  private readonly _servicePriorities: ServicePriority[] = [];
  private readonly _annualPeriods: ProjectAnnualPeriod[] = [];
  constructor(props: P, id: string = null) {
    super(props, id);
    if (!isEmpty(props.externalReferenceIds)) {
      this._externalReferenceIds = props.externalReferenceIds.map(extId => {
        return ExternalReferenceId.create(extId).getValue();
      });
    }
    if (!isEmpty(props.servicePriorities)) {
      this._servicePriorities = props.servicePriorities.map(sp => {
        return ServicePriority.create(sp).getValue();
      });
    }
    if (!isEmpty(props.annualPeriods)) {
      this._annualPeriods = props.annualPeriods.map(ap => {
        return ProjectAnnualPeriod.create(ap).getValue();
      });
    }
  }

  public equals(otherPlainProject: PlainProject<any>): boolean {
    return super.equals(otherPlainProject) && this.innerEquals(otherPlainProject);
  }

  private innerEquals(otherPlainProject: PlainProject<any>): boolean {
    return (
      this.executorId === otherPlainProject.executorId &&
      this.interventionIds === otherPlainProject.interventionIds &&
      this.boroughId === otherPlainProject.boroughId &&
      this.projectName === otherPlainProject.projectName &&
      this.startYear === otherPlainProject.startYear &&
      this.endYear === otherPlainProject.endYear &&
      this.projectTypeId === otherPlainProject.projectTypeId
    );
  }
}
