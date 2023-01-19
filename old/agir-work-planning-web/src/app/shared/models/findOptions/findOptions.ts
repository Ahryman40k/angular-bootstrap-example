export interface IFindOptions<T, K> {
  [key: string]: any;
  fields: T[];
  expand?: K;
}
