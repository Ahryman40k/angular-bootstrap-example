import { AnnualProgram, StoredAnnualProgram,  } from '@ahryman40k/types/program-api-types';
import { MongoClient } from 'mongodb';


import { SystemsConfig } from '../config';

export type AnnualProgramStorage = {
  "annual-program.create": (program: AnnualProgram[]) => Promise<StoredAnnualProgram[]>
  "annual-program.get_all": () => Promise<StoredAnnualProgram[]>
  "annual-program.get_by_id": ( ids: string[]) => Promise<StoredAnnualProgram[]>
}

export type AnnualProgramStorageKeys = keyof AnnualProgramStorage;


export const createAnnualProgramStorage = async (config: SystemsConfig): Promise<AnnualProgramStorage> => {
  // connect to mongodb
  const client = new MongoClient(config.mongo.url);

  const connection = await client.connect();
  const database = connection.db(config.mongo.database_name);
  const collection = database.collection('annual_program');

  const create = async (program: AnnualProgram[]) => {
    const result = await collection.insertMany(program);
    return collection.find<StoredAnnualProgram>( { _id: { $in: Object.values(result.insertedIds) } } ).toArray();
  } 

  const getAll = async () => {
    return collection.find<StoredAnnualProgram>({}).toArray();
  }

  const getById = async ( ids: string[]) => {
    return collection.find<StoredAnnualProgram>({ _id : { $in: { ids }}}).toArray();
  }

  // then return type
  return {
    "annual-program.create": create,
    "annual-program.get_all": getAll,
    "annual-program.get_by_id": getById
  };
};
