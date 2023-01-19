import { init as initMongoUtilsLib } from '@villemontreal/core-utils-mongo-nodejs-lib';
import { createLogger } from '../../utils/logger';
import { mongoDatabase, MongoDatabase } from './mongo/mongoDatabase';

const database = mongoDatabase;
export async function initDatabase(init: boolean, mocked = false) {
  // ==========================================
  // Initializes the Mongo DB library.
  // ==========================================
  if (!mocked) {
    initMongoUtilsLib(createLogger);
  }

  // ==========================================
  // Initializes Mongoose. You can remove this if
  // you only want to use the utilities from the
  // "@villemontreal/core-utils-mongo-nodejs-lib"
  // library.
  //
  // In testing mode we are going to mock the db
  // manually...
  // ==========================================
  if (init) {
    await database.init();
  }
}

export function db(): MongoDatabase {
  return database;
}
