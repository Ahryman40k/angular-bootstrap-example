import { IDatabase } from './iDatabase';
import { IDatabaseClient } from './iDatabaseClient';

interface IModels {
  [model: string]: any;
}

export abstract class Database<C extends IDatabaseClient> implements IDatabase {
  protected _client: C;
  // tslint:disable:prefer-readonly
  protected _models: IModels;

  constructor() {
    this._models = {} as IModels;
  }

  public get client(): IDatabaseClient {
    return this._client;
  }

  public get models(): IModels {
    return this._models;
  }

  public abstract init(): Promise<void>;

  protected abstract initModels(): void;

  public async disconnect(): Promise<void> {
    if (await this._client.isConnected()) {
      await this._client.endConnection();
    }
  }
}
