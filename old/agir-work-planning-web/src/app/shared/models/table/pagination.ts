export interface IPagination {
  currentPage: number;
  limit: number;
  offset?: number;
  pageSize: number;
  totalCount: number;
}
