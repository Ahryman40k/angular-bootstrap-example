import { getMongooseConnection, initMongoose } from '@villemontreal/core-utils-mongo-nodejs-lib';
import { Connection } from 'mongoose';
import { configs } from '../../../../config/configs';
import { IDatabaseClient } from '../iDatabaseClient';

export class MongoClient implements IDatabaseClient {
  private _mongoConnection: Connection;

  public async openConnection(): Promise<void> {
    await initMongoose(configs.mongo);
    this._mongoConnection = getMongooseConnection();
  }

  public getConnection() {
    return this._mongoConnection;
  }
  /*
   * readyState = 1 -> connected
   * readyState = 2 -> connecting
   */
  public async isConnected() {
    if (getMongooseConnection().readyState === 1) {
      return true;
    }
    return false;
  }

  public async endConnection(): Promise<void> {
    await this._mongoConnection.close();
  }
}
