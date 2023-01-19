export interface IDatabaseClient {
  openConnection(): Promise<void>;
  isConnected(): Promise<boolean>;
  endConnection(): Promise<void>;
}
