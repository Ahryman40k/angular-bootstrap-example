import { ILength } from '@villemontreal/agir-work-planning-lib';
import { mergeProperties } from '../../../../tests/utils/testHelper';
import { Length, LengthUnit } from '../models/length';

export function getInitialLength(): ILength {
  return {
    unit: LengthUnit.meter,
    value: 0
  };
}

export function getLength(props?: Partial<ILength>): Length {
  const lengthPropsMerged = mergeProperties(
    {
      unit: LengthUnit.meter,
      value: 100
    },
    props
  );
  return Length.create(lengthPropsMerged).getValue();
}
