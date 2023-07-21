import { Submission } from '@ahryman40k/types/submission-api-types';
import { MongoClient, Db } from 'mongodb';

import { SystemsConfig } from '../config';

export type SubmissionStorage = {
  'submission.create': (submission: Partial<Submission>[]) => Promise<Submission[]>;
  'submission.get_all': () => Promise<Submission[]>;
  'submission.get_by_id': (ids: string[]) => Promise<Submission[]>;
  'submission.get_by_executorId': (ids: string[]) => Promise<Submission[]>;
};

export type SubmissionStorageKeys = keyof SubmissionStorage;

const DefaultMongoConnectionProvider = async (config: SystemsConfig) => {
  const client = new MongoClient(config.mongo.url);

  const connection = await client.connect();
  return {
    connection,
    db: connection.db(config.mongo.database_name),
  };
};

export const createSubmissionStorage = async (
  config: SystemsConfig,
  provider: (config: SystemsConfig) => Promise<{ connection: MongoClient; db: Db }> = DefaultMongoConnectionProvider
): Promise<SubmissionStorage> => {
  // connect to mongodb
  const { db: database } = await provider(config);
  const collection = database.collection('submission');

  const create = async (submission: Partial<Submission>[]) => {
    const result = await collection.insertMany(submission);
    return collection.find<Submission>({ _id: { $in: Object.values(result.insertedIds) } }).toArray();
  };

  const getAll = async () => {
    return collection.find<Submission>({}).toArray();
  };

  const getById = async (ids: string[]) => {
    return collection.find<Submission>({ _id: { $in: { ids } } }).toArray();
  };

  const getByExecutorId = async (ids: string[]) => {
    return collection.find<Submission>({ executorId: { $in: { ids } } }).toArray();
  };

  // then return type
  return {
    'submission.create': create,
    'submission.get_all': getAll,
    'submission.get_by_id': getById,
    'submission.get_by_executorId': getByExecutorId,
  };
};
