import { IPaging } from '@villemontreal/agir-work-planning-lib';

export interface IPaginatedResults<T> {
  paging?: IPaging;
  items?: T[];
}

export const EMPTY_PAGINATED_RESULT: IPaginatedResults<any> = { items: [], paging: { totalCount: 0 } };
