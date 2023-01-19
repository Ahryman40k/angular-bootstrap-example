import { mergeProperties } from '../../../../tests/utils/testHelper';
import { ICounter } from '../models/counter';

const counterProps: Omit<ICounter, 'id'> = {
  key: 'drm',
  sequence: 5000,
  availableValues: [5000],
  __v: 1
};

export function getCounterProps(props?: Partial<ICounter>): ICounter {
  return mergeProperties(counterProps, props);
}
