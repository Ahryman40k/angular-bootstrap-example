import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Order, OrderByCriteria } from '../../../shared/findOptions/orderByCriteria';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import {
  IRtuImportLogCriterias,
  IRtuImportLogFindOptionsProps,
  RtuImportLogFindOptions
} from './rtuImportLogFindOptions';

export interface IRtuImportLogsPaginatedFindOptionsProps extends IRtuImportLogFindOptionsProps, IFindPaginatedProps {
  criterias: IRtuImportLogCriterias;
  limit: number;
  offset: number;
  fields?: string[];
}

export class RtuImportLogFindPaginatedOptions extends FindPaginated<IRtuImportLogsPaginatedFindOptionsProps> {
  public static create(props: IRtuImportLogsPaginatedFindOptionsProps): Result<RtuImportLogFindPaginatedOptions> {
    const guardFindOptions = RtuImportLogFindOptions.guard(props);
    const guardPaginated = FindPaginated.guard(props);
    const guard = Guard.combine([guardFindOptions, guardPaginated]);
    if (!guard.succeeded) {
      return Result.fail<RtuImportLogFindPaginatedOptions>(guard);
    }
    const rtuImportLogFindOptions = new RtuImportLogFindPaginatedOptions(props);
    return Result.ok<RtuImportLogFindPaginatedOptions>(rtuImportLogFindOptions);
  }

  constructor(props: IRtuImportLogsPaginatedFindOptionsProps) {
    super(props);
    if (!this.orderByCriterias.find(orderBy => orderBy.field === 'createdAt')) {
      this.orderByCriterias.push(
        OrderByCriteria.create({
          field: 'createdAt',
          order: Order.DESCENDING
        }).getValue()
      );
    }
  }

  public get fields(): string[] {
    return this.props.fields;
  }
}
