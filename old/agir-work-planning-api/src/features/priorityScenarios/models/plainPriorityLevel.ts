import { isEmpty } from 'lodash';
import { GenericEntity } from '../../../shared/domain/genericEntity';
import { Guard, GuardType, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { IPriorityLevelCriteriaProps, isPriorityLevelCriteria, PriorityLevelCriteria } from './priorityLevelCriteria';
import {
  IPriorityLevelSortCriteriaProps,
  isPriorityLevelSortCriteria,
  PriorityLevelSortCriteria
} from './priorityLevelSortCriteria';
import { ProjectCategoryCriteria } from './projectCategoryCriteria';

export interface IPlainPriorityLevelProps {
  rank: number;
  criteria: IPriorityLevelCriteriaProps;
  sortCriterias?: IPriorityLevelSortCriteriaProps[];
}

export class PlainPriorityLevel<P extends IPlainPriorityLevelProps> extends GenericEntity<P> {
  public static create(props: IPlainPriorityLevelProps): Result<PlainPriorityLevel<IPlainPriorityLevelProps>> {
    const guardPlain = this.guard(props);
    const guard = Guard.combine([guardPlain]);
    if (!guard.succeeded) {
      return Result.fail<PlainPriorityLevel<IPlainPriorityLevelProps>>(guard);
    }
    const plainPriorityLevel = new PlainPriorityLevel(props);
    return Result.ok<PlainPriorityLevel<IPlainPriorityLevelProps>>(plainPriorityLevel);
  }

  public static guard(props: IPlainPriorityLevelProps, valueName = ''): IGuardResult {
    const guardRank = Guard.guard({
      argument: props.rank,
      argumentName: `${valueName}rank`,
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
    });
    let guardCriteria = Guard.guard({
      argument: props.criteria,
      argumentName: `${valueName}criteria`,
      guardType: [GuardType.NULL_OR_UNDEFINED]
    });
    if (guardCriteria.succeeded) {
      guardCriteria = PriorityLevelCriteria.guard(props.criteria);
    }
    let guardSortCriterias: IGuardResult[] = [{ succeeded: true }];
    if (!isEmpty(props.sortCriterias)) {
      guardSortCriterias = props.sortCriterias.map(c => PriorityLevelSortCriteria.guard(c));
    }
    return Guard.combine([guardRank, guardCriteria, ...guardSortCriterias]);
  }

  private readonly _criteria: PriorityLevelCriteria;
  private readonly _sortCriterias: PriorityLevelSortCriteria[];
  constructor(props: P) {
    super(props);
    this._criteria = isPriorityLevelCriteria(props.criteria)
      ? props.criteria
      : this.getPriorityLevelCriteria(props.criteria, props.rank === 1);

    if (isEmpty(props.sortCriterias)) {
      this._sortCriterias = PriorityLevelSortCriteria.getDefault();
    } else {
      this._sortCriterias = props.sortCriterias.map(sc =>
        isPriorityLevelSortCriteria(sc) ? sc : PriorityLevelSortCriteria.create(sc).getValue()
      );
    }
  }

  private getPriorityLevelCriteria(props: IPriorityLevelCriteriaProps, isDefault = false): PriorityLevelCriteria {
    let updatedProps = props;
    if (isDefault) {
      updatedProps = { ...props, projectCategory: [ProjectCategoryCriteria.getDefault()] };
    }
    return PriorityLevelCriteria.create(updatedProps).getValue();
  }

  public get rank(): number {
    return this.props.rank;
  }

  public get criteria(): PriorityLevelCriteria {
    return this._criteria;
  }

  public get sortCriterias(): PriorityLevelSortCriteria[] {
    return this._sortCriterias;
  }

  public equals(otherPlainPriorityLevel: PlainPriorityLevel<any>): boolean {
    return super.equals(otherPlainPriorityLevel) && this.innerEquals(otherPlainPriorityLevel);
  }

  private innerEquals(otherPlainPriorityLevel: PlainPriorityLevel<any>): boolean {
    return this.rank === otherPlainPriorityLevel.rank && this.criteria.equals(otherPlainPriorityLevel.criteria);
  }
}
