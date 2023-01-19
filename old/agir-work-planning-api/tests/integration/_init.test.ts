import {
  constants as mongoConstants,
  getMongooseConnection,
  init,
  initMongoose,
  mongoUtils
} from '@villemontreal/core-utils-mongo-nodejs-lib/dist/src';
import * as _ from 'lodash';

import { configs } from '../../config/configs';
import { constants } from '../../config/constants';
import { initDatabase } from '../../src/features/database/DB';
import { createLogger } from '../../src/utils/logger';

before(async function() {
  init(createLogger);
  await mongoUtils.mockMongoose(this, configs.mongo.mockServer.serverVersion);
  await initMongoose(configs.mongo);
  await initDatabase(true, true);
});

after(async () => {
  await mongoUtils.dropMockedDatabases();
});

export async function integrationAfter(): Promise<void> {
  await cleanMongoCollections();
}

async function cleanMongoCollections(): Promise<void> {
  const collectionsToKeep = [
    mongoConstants.mongo.collectionNames.APP_SCHEMA,
    constants.mongo.collectionNames.TAXONOMIES
  ];

  const collections = _.values(
    _.pickBy(getMongooseConnection().collections, (_x, key) => !collectionsToKeep.includes(key))
  );
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}
