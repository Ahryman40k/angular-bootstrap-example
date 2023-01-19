import {
  IBudget,
  IFeatureCollection,
  IInterventionArea,
  IPlainIntervention
} from '@villemontreal/agir-work-planning-lib';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import {
  ExternalReferenceId,
  IExternalReferenceIdProps
} from '../../../shared/domain/externalReferenceId/externalReferenceId';
import { IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { isEmpty } from '../../../utils/utils';
import { Asset } from '../../asset/models/asset';

export interface IPlainInterventionProps extends IPlainIntervention {
  externalReferenceIds: IExternalReferenceIdProps[];
  assets: Asset[];
  estimate: number | any;
}

export class PlainIntervention<P extends IPlainInterventionProps> extends AggregateRoot<P> {
  public static create(props: IPlainInterventionProps): Result<PlainIntervention<IPlainInterventionProps>> {
    // TODO
    // should not happen if body is destructured before entering method
    if (!props) {
      return Result.fail<PlainIntervention<IPlainInterventionProps>>(`Empty body`);
    }
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<PlainIntervention<IPlainInterventionProps>>(guard);
    }
    const plainIntervention = new PlainIntervention(props);
    return Result.ok<PlainIntervention<IPlainInterventionProps>>(plainIntervention);
  }

  // TODO set up intervention guards
  public static guard(props: IPlainInterventionProps): IGuardResult {
    return { succeeded: true };
  }

  public get externalReferenceIds(): ExternalReferenceId[] {
    return this._externalReferenceIds;
  }

  public get medalId(): string {
    return this.props.medalId;
  }

  public get importRevisionDate(): string {
    return this.props.importRevisionDate;
  }

  public get interventionName(): string {
    return this.props.interventionName;
  }

  public get interventionTypeId(): string {
    return this.props.interventionTypeId;
  }

  public get workTypeId(): string {
    return this.props.workTypeId;
  }

  public get requestorId(): string {
    return this.props.requestorId;
  }

  public get boroughId(): string {
    return this.props.boroughId;
  }

  public get status(): string {
    return this.props.status;
  }

  public get interventionYear(): number {
    return this.props.interventionYear;
  }

  public get planificationYear(): number {
    return this.props.planificationYear;
  }

  public get endYear(): number {
    return this.props.endYear;
  }

  public get estimate(): number | IBudget {
    return this.props.estimate;
  }

  public get programId(): string {
    return this.props.programId;
  }

  public get contact(): string {
    return this.props.contact;
  }

  public get assets(): Asset[] {
    return this.props.assets;
  }

  public get interventionArea(): IInterventionArea {
    return this.props.interventionArea;
  }

  public get roadSections(): IFeatureCollection {
    return this.props.roadSections;
  }

  public get importFlag(): string {
    return this.props.importFlag;
  }

  public get decisionRequired(): boolean {
    return this.props.decisionRequired;
  }

  private readonly _externalReferenceIds: ExternalReferenceId[] = [];
  constructor(props: P, id: string = null) {
    super(props, id);
    if (!isEmpty(props.externalReferenceIds)) {
      this._externalReferenceIds = props.externalReferenceIds.map(extId => {
        return ExternalReferenceId.create(extId).getValue();
      });
    }
  }

  public equals(otherPlainIntervention: PlainIntervention<any>): boolean {
    return super.equals(otherPlainIntervention) && this.innerEquals(otherPlainIntervention);
  }

  private innerEquals(otherPlainIntervention: PlainIntervention<any>): boolean {
    return (
      this.workTypeId === otherPlainIntervention.workTypeId &&
      this.requestorId === otherPlainIntervention.requestorId &&
      this.boroughId === otherPlainIntervention.boroughId &&
      this.planificationYear === otherPlainIntervention.planificationYear &&
      this.endYear === otherPlainIntervention.endYear &&
      this.interventionYear === otherPlainIntervention.interventionYear
    );
  }
}
