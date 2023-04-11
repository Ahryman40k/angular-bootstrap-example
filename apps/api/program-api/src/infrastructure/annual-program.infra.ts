import { AnnualProgram, StoredAnnualProgram } from '@ahryman40k/types/program-api-types';
import { MongoClient, Db } from 'mongodb';

import { SystemsConfig } from '../config';

export type AnnualProgramStorage = {
  'annual-program.create': (program: AnnualProgram[]) => Promise<StoredAnnualProgram[]>;
  'annual-program.get_all': () => Promise<StoredAnnualProgram[]>;
  'annual-program.get_by_id': (ids: string[]) => Promise<StoredAnnualProgram[]>;
};

export type AnnualProgramStorageKeys = keyof AnnualProgramStorage;

const DefaultMongoConnectionProvider = async (config: SystemsConfig) => {
  const client = new MongoClient(config.mongo.url);

  const connection = await client.connect();
  return {
    connection,
    db: connection.db(config.mongo.database_name),
  };
};

export const createAnnualProgramStorage = async (
  config: SystemsConfig,
  provider: (config: SystemsConfig) => Promise<{ connection: MongoClient; db: Db }> = DefaultMongoConnectionProvider
): Promise<AnnualProgramStorage> => {
  // connect to mongodb
  const { db: database } = await provider(config);
  const collection = database.collection('annual_program');

  const create = async (program: AnnualProgram[]) => {
    const result = await collection.insertMany(program);
    return collection.find<StoredAnnualProgram>({ _id: { $in: Object.values(result.insertedIds) } }).toArray();
  };

  const getAll = async () => {
    return collection.find<StoredAnnualProgram>({}).toArray();
  };

  const getById = async (ids: string[]) => {
    return collection.find<StoredAnnualProgram>({ _id: { $in: { ids } } }).toArray();
  };

  // then return type
  return {
    'annual-program.create': create,
    'annual-program.get_all': getAll,
    'annual-program.get_by_id': getById,
  };
};
