import { AnnualProgram } from '@ahryman40k/types/program-api-types';
import { MongoClient } from 'mongodb';
import { SystemsConfig } from '../config';

import { AnnualProgramStorage, createAnnualProgramStorage } from './annual-program.infra';

const TestMongoConnectionProvider = async (config: SystemsConfig) => {
  const client = new MongoClient(config.mongo.url);

  const connection = await client.connect();
  return {
    connection,
    db: connection.db(config.mongo.database_name),
  };
};

const globalAny: any = global;
globalAny.__MONGO_URI__;
globalAny.__MONGO_DB_NAME__;

const TestConfig: SystemsConfig = {
  mongo: {
    url: globalAny.__MONGO_URI__,
    database_name: globalAny.__MONGO_DB_NAME__,
  },
};

describe('insert', () => {
  let annual_storage_provider: AnnualProgramStorage;

  beforeAll(async () => {
    annual_storage_provider = await createAnnualProgramStorage(TestConfig, TestMongoConnectionProvider);
  });

  afterAll(async () => { });

  it('should create Annual Program', async () => {
    const mockProgram: AnnualProgram = { executorId: 'borough', year: 2023, budgetCap: 0, status: 'new' };
    await annual_storage_provider['annual-program.create']([mockProgram]);

    const insertedProgram = await annual_storage_provider['annual-program.get_by_id'](['666']);
    expect(insertedProgram).toEqual(mockProgram);
  });
});
