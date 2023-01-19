import { configs } from '../../../../config/configs';
import { constants } from '../../../../config/constants';
import { findOneAndUpsertCounter, IAlphaNumericIdIncPluginOptions } from '../../../middlewares/alphaNumericIdIncPlugin';
import { appUtils } from '../../../utils/utils';
import { db } from '../../database/DB';
import { MongoDatabase } from '../../database/mongo/mongoDatabase';
import { ICounter } from '../models/counter';
import { CounterModel } from './counterModel';

export class CounterRepository {
  protected readonly db: MongoDatabase;
  private testingModeSequenceIntervention = 0;
  private testingModeSequenceProject = 0;
  constructor() {
    this.db = db();
  }
  public get model(): CounterModel {
    return this.db.models.Counters;
  }

  public async findOne(options: IAlphaNumericIdIncPluginOptions): Promise<ICounter> {
    return this.model
      .findOne({ key: options.key })
      .lean()
      .exec();
  }

  public async findOneAndUpsert(key: string, sequence = 1): Promise<ICounter> {
    const result = await findOneAndUpsertCounter(key, { sequence });
    return {
      id: result._id,
      key: result.key,
      sequence: result.sequence,
      availableValues: result.availableValues
    };
  }

  public async getNextGeneratedIds(options: IAlphaNumericIdIncPluginOptions): Promise<string[]> {
    let current: ICounter;
    if (!configs.testingMode) {
      current = await this.findOne(options);
    } else {
      const sequence =
        options.key === constants.mongo.collectionNames.PROJECTS
          ? this.testingModeSequenceProject++
          : this.testingModeSequenceIntervention++;
      current = {
        sequence
      } as ICounter;
    }
    const nextIds = [];
    let i = 1;
    while (i <= options.sequence) {
      nextIds.push(options.prefix + appUtils.padStartNumberId(current.sequence + i));
      i++;
    }
    await this.findOneAndUpsert(options.key, options.sequence);
    return nextIds;
  }

  public resetTestingModeSequence() {
    this.testingModeSequenceIntervention = 0;
    this.testingModeSequenceProject = 0;
  }
}
export const counterRepository: CounterRepository = new CounterRepository();
