import { IHistory } from '@villemontreal/agir-work-planning-lib/dist/src';
import { IBaseRepository } from '../../repositories/core/baseRepository';
import { FindOptions, IFindOptionsProps } from '../../shared/findOptions/findOptions';

export interface IHistoryRepository extends IBaseRepository<IHistory, FindOptions<IFindOptionsProps>> {}
