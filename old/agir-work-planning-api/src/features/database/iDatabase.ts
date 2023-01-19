export interface IDatabase {
  init(): Promise<void>;
  disconnect(): Promise<void>;
}
