export interface IApiErrorMapper<E> {
  toApiError(e: any): E;
}
