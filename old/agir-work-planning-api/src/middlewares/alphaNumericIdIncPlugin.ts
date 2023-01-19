import { getMongooseConnection } from '@villemontreal/core-utils-mongo-nodejs-lib/dist/src';
import { uniq } from 'lodash';
import * as mongoose from 'mongoose';

import { configs } from '../../config/configs';
import { constants } from '../../config/constants';
import { ICounter } from '../features/counters/models/counter';
import { ICounterMongoDocument } from '../features/counters/mongo/counterModel';
import { counterSchema, ICounterAttributes } from '../features/counters/mongo/counterSchema';
import { appUtils } from '../utils/utils';

export interface IAlphaNumericIdIncPluginOptions {
  key: string;
  prefix: string;
  sequence?: number;
}

let testingModeSequence = 1;
export function alphaNumericIdIncPlugin(schema: mongoose.Schema, options: IAlphaNumericIdIncPluginOptions): void {
  schema.pre('save', async function(): Promise<void> {
    const model = this as { _id: string };
    let document: ICounterAttributes;
    if (!configs.testingMode) {
      document = await findOneAndUpsertCounter(options.key, { sequence: options.sequence });
    } else {
      document = { sequence: testingModeSequence++ } as ICounterAttributes;
    }
    const formattedNumber = options.prefix + appUtils.padStartNumberId(document.sequence);
    model._id = formattedNumber;
  });
}

let _counterModel: mongoose.Model<ICounterMongoDocument>;
export function counterModel(): mongoose.Model<ICounterMongoDocument> {
  if (!_counterModel) {
    _counterModel = getMongooseConnection().model<ICounterMongoDocument>(
      constants.mongo.collectionNames.COUNTERS,
      counterSchema
    );
  }
  return _counterModel;
}

export async function findOneAndUpsertCounter(
  key: string,
  incomingCounter: Partial<ICounterAttributes> = {
    _id: undefined,
    sequence: 1,
    key,
    availableValues: [],
    __v: undefined
  }
): Promise<ICounterAttributes> {
  const incSequence = !isNaN(incomingCounter?.sequence) ? incomingCounter.sequence : 1;
  const update = {
    $inc: { sequence: incSequence, __v: 1 },
    availableValues: incomingCounter.availableValues || []
  };
  const options = incomingCounter.__v ? { new: true } : { new: true, upsert: true };
  return findOneAndUpdate(key, update, options);
}

export async function findOneAndOverwriteCounter(key: string, incomingCounter: ICounterAttributes): Promise<ICounter> {
  let mongoDocument: ICounterMongoDocument;
  let retry = 3;
  while (retry > 0) {
    const lastCounter: ICounterAttributes = await counterModel()
      .findOne({ key })
      .lean()
      .exec();
    const update = {
      $inc: { __v: 1 },
      sequence: lastCounter.sequence > incomingCounter.sequence ? lastCounter.sequence : incomingCounter.sequence,
      availableValues: uniq([...lastCounter.availableValues, ...incomingCounter.availableValues]).sort((a, b) => a - b),
      __v: lastCounter.__v
    };
    const options = { new: true };
    mongoDocument = await findOneAndUpdate(key, update, options);
    if (!mongoDocument) {
      retry--;
      continue;
    }
    retry = 0;
  }
  return mongoDocument?.toJSON() || null;
}

function findOneAndUpdate(key: string, incomingCounter: any, options: mongoose.QueryFindOneAndUpdateOptions) {
  return new Promise<ICounterMongoDocument>((resolve, reject) => {
    const v = incomingCounter.__v;
    delete incomingCounter.__v;
    counterModel().findOneAndUpdate(v ? { key, __v: v } : { key }, incomingCounter, options, (err, doc) => {
      if (err) {
        reject(err);
      } else {
        resolve(doc);
      }
    });
  });
}

export function resetTestingModeSequence(): void {
  testingModeSequence = 1;
}
