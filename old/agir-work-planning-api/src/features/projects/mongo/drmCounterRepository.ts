import { findOneAndOverwriteCounter, findOneAndUpsertCounter } from '../../../middlewares/alphaNumericIdIncPlugin';
import { ICounter } from '../../counters/models/counter';
import { CounterRepository } from '../../counters/mongo/counterRepository';
import { ICounterAttributes } from '../../counters/mongo/counterSchema';

class DrmCounterRepository extends CounterRepository {
  private retry: number;
  constructor() {
    super();
  }

  public async getDrmNumbers(key: string, sequence = 1): Promise<number[]> {
    this.retry = 3;
    const drmNumbers: number[] = [];
    while (this.retry > 0) {
      const counter = await this.findOne({ key, prefix: undefined });
      const isNewSequenceRequired = sequence > counter.availableValues.length;
      const maxIteration = isNewSequenceRequired ? counter.availableValues.length : sequence;
      for (let i = 0; i < maxIteration; i++) {
        drmNumbers.push(counter.availableValues.shift());
      }
      const addToSequence = sequence - maxIteration;
      let currentSequence = counter.sequence;
      for (let i = 1; i <= addToSequence; i++) {
        currentSequence += 1;
        drmNumbers.push(currentSequence);
      }
      // Set the sequence increment
      counter.sequence = addToSequence;

      const newCounter = await findOneAndUpsertCounter('drm', counter);
      if (!newCounter) {
        this.retry--;
        if (this.retry === 0) {
          drmNumbers.splice(0, drmNumbers.length);
        }
        setTimeout(() => undefined, 250);
        continue;
      }

      this.retry = 0;
    }
    return drmNumbers;
  }

  public async save(drmNumberCounter: Partial<ICounterAttributes>): Promise<ICounter> {
    return findOneAndOverwriteCounter('drm', drmNumberCounter as ICounterAttributes);
  }
}
export const drmCounterRepository = new DrmCounterRepository();
