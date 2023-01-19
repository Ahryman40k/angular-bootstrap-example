import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Order, OrderByCriteria } from '../../../shared/findOptions/orderByCriteria';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import {
  IRtuExportLogCriterias,
  IRtuExportLogFindOptionsProps,
  RtuExportLogFindOptions
} from './rtuExportLogFindOptions';

export interface IRtuExportLogsPaginatedFindOptionsProps extends IRtuExportLogFindOptionsProps, IFindPaginatedProps {
  criterias: IRtuExportLogCriterias;
  limit: number;
  offset: number;
  fields?: string[];
}

export class RtuExportLogFindPaginatedOptions extends FindPaginated<IRtuExportLogsPaginatedFindOptionsProps> {
  public static create(props: IRtuExportLogsPaginatedFindOptionsProps): Result<RtuExportLogFindPaginatedOptions> {
    const guardFindOptions = RtuExportLogFindOptions.guard(props);
    const guardPaginated = FindPaginated.guard(props);
    const guard = Guard.combine([guardFindOptions, guardPaginated]);
    if (!guard.succeeded) {
      return Result.fail<RtuExportLogFindPaginatedOptions>(guard);
    }
    const rtuImportLogFindOptions = new RtuExportLogFindPaginatedOptions(props);
    return Result.ok<RtuExportLogFindPaginatedOptions>(rtuImportLogFindOptions);
  }

  constructor(props: IRtuExportLogsPaginatedFindOptionsProps) {
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
