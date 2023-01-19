import { GenericEntity } from '../domain/genericEntity';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../logic/guard';
import { Result } from '../logic/result';
import { Expand, ExpandOptionsEnum } from './expand';
import { OrderByCriteria } from './orderByCriteria';

// tslint:disable:no-empty-interface
export interface ICriterias {
  id?: string | string[];
}

export interface IFindOptionsProps {
  criterias?: ICriterias;
  offset?: number;
  limit?: number;
  orderBy?: string;
  expand?: string;
  fields?: string | string[];
  countBy?: string;
}

export class FindOptions<C extends IFindOptionsProps> extends GenericEntity<C> {
  public static create(props: IFindOptionsProps): Result<any> {
    const guard = FindOptions.guard(props);

    if (!guard.succeeded) {
      return Result.fail<FindOptions<any>>(guard);
    }
    const findOptions = new FindOptions(props);
    return Result.ok<FindOptions<any>>(findOptions);
  }

  public static guard(props: IFindOptionsProps): IGuardResult {
    const guardOrderBy = OrderByCriteria.guard(props.orderBy);
    const guardExpand = { succeeded: true };
    // TODO REACTIVATE EXPAND GUARD
    // FIND A WAY TO PASS CORRESPONDING ENUM
    // const guardExpand = Expand.guard(props.expand);
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.offset,
        argumentName: 'offset',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.limit,
        argumentName: 'limit',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      }
    ];
    return Guard.combine([guardOrderBy, guardExpand, ...Guard.guardBulk(guardBulk)]);
  }

  protected static guardIds(ids: string[]): IGuardResult[] {
    return ids.map((id, index) =>
      Guard.guard({
        argument: id,
        argumentName: `id[${index}]`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
      })
    );
  }

  public static hasExpand(findOptions: FindOptions<any>, expand: ExpandOptionsEnum): boolean {
    if (!findOptions || !findOptions.expandOptions) {
      return false;
    }
    const result = (expandOption: Expand) => expandOption.field === expand;
    return findOptions.expandOptions.some(result);
  }

  private readonly _orderByCriterias: OrderByCriteria[] = [];
  private readonly _expandOptions: Expand[] = [];
  private readonly _fieldsToGet: string[] = [];
  protected constructor(props: C) {
    super(props);
    if (props.orderBy) {
      const orderBys: string[] = props.orderBy.split(',');
      this._orderByCriterias = orderBys.map(orderBy => {
        return OrderByCriteria.create({
          field: OrderByCriteria.getField(orderBy),
          order: OrderByCriteria.getOrder(orderBy)
        }).getValue();
      });
    }
    if (props.expand) {
      const expandSplit: string[] = Array.isArray(props.expand) ? props.expand : props.expand.split(',');
      this._expandOptions = expandSplit.map(expand => {
        return Expand.create({
          field: expand
        }).getValue();
      });
    }
    if (props.offset) {
      this.setOffset(Number(props.offset));
    }
    if (props.limit) {
      this.setLimit(Number(props.limit));
    }
    if (props.fields) {
      this._fieldsToGet = Array.isArray(props.fields) ? props.fields : props.fields.split(',');
    }
  }

  public get criterias() {
    return this.props.criterias;
  }

  public get offset() {
    return this.props.offset;
  }

  public get limit() {
    return this.props.limit;
  }

  public get orderBy() {
    return this.props.orderBy;
  }

  public get orderByCriterias(): OrderByCriteria[] {
    return this._orderByCriterias;
  }

  public setOffset(offset: number) {
    this.props.offset = offset;
  }

  public setLimit(limit: number) {
    this.props.limit = limit;
  }

  public get expandOptions() {
    return this._expandOptions;
  }

  public get fields() {
    return this._fieldsToGet;
  }

  public get countBy() {
    return this.props.countBy;
  }
}
