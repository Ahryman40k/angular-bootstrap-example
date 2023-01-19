import { Guard, GuardType, IGuardResult } from '../logic/guard';
import { Result } from '../logic/result';

export enum Order {
  ASCENDING = 1,
  DESCENDING = -1
}

export interface IOrderByCriteriaProps {
  field: string;
  order: Order;
}

export class OrderByCriteria {
  public static create(props: IOrderByCriteriaProps): Result<OrderByCriteria> {
    return Result.ok<OrderByCriteria>(new OrderByCriteria(props));
  }

  public static guard(orderBy: string): IGuardResult {
    let guardOrderBy = { succeeded: true };
    if (orderBy) {
      const guardOrderByParam: IGuardResult = Guard.guard({
        argument: orderBy,
        argumentName: 'orderBy',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_COMMA_SEPARATED]
      });

      // TODO HOW TO CHECK ON FIELD VALUES TO HAVE VALID ORDER BY VALUES ?
      // const orderBys: string[] = orderBy.split(',');

      // const guardOrderByValues: IGuardResult[] = orderBys.map(orderByValue =>
      //   Guard.guard({
      //     argument: orderByValue,
      //     argumentName: orderByValue,
      //     guardType: [GuardType.VALID_ORDER_BY_VALUE]
      //   })
      // );
      // guardOrderBy = Guard.combine([guardOrderByParam, ...guardOrderByValues]);
      guardOrderBy = Guard.combine([guardOrderByParam]);
    }
    return guardOrderBy;
  }

  public static getOrder(orderByField: string): Order {
    if (/[-].*$/.test(orderByField)) {
      return Order.DESCENDING;
    }
    return Order.ASCENDING;
  }

  public static getField(field: string): string {
    if (/[-,+].*$/.test(field)) {
      return field.substring(1);
    }
    return field;
  }

  protected props: IOrderByCriteriaProps;
  protected constructor(props: IOrderByCriteriaProps) {
    this.props = props;
  }

  public get field(): string {
    return this.props.field;
  }

  public get order(): Order {
    return this.props.order;
  }
}
