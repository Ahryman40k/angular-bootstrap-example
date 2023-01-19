import {
  ProgramBookObjectiveTargetType,
  ProgramBookObjectiveType
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { mergeProperties } from '../../../../tests/utils/testHelper';
import { getAudit } from '../../audit/test/auditTestHelper';
import { IObjectiveProps, Objective } from '../models/objective';
import { IObjectiveValuesProps, ObjectiveValues } from '../models/objectiveValues';
import { IPlainObjectiveProps, PlainObjective } from '../models/plainObjective';

const plainObjective: IPlainObjectiveProps = {
  name: 'plain objective',
  targetType: ProgramBookObjectiveTargetType.budget,
  objectiveType: ProgramBookObjectiveType.threshold,
  referenceValue: 10,
  workTypeIds: [],
  assetTypeIds: []
};

export function getPlainObjectiveProps(props?: Partial<IPlainObjectiveProps>): IPlainObjectiveProps {
  return mergeProperties(plainObjective, props);
}

export function getPlainObjective(props?: Partial<IPlainObjectiveProps>): PlainObjective<IPlainObjectiveProps> {
  return PlainObjective.create(getPlainObjectiveProps(props)).getValue();
}

const objectiveValues: IObjectiveValuesProps = {
  reference: 10,
  calculated: 0
};
export function getObjectiveValuesProps(props?: Partial<IObjectiveValuesProps>): IObjectiveValuesProps {
  return mergeProperties(objectiveValues, props);
}
export function getObjectiveValues(props?: Partial<IObjectiveValuesProps>): ObjectiveValues {
  return ObjectiveValues.create(getObjectiveValuesProps(props)).getValue();
}

const objectiveProps: IObjectiveProps = {
  ...getPlainObjectiveProps(),
  name: 'objective',
  values: getObjectiveValues(),
  pin: false,
  audit: getAudit()
};

export function getObjectiveProps(props?: Partial<IPlainObjectiveProps>): IObjectiveProps {
  return mergeProperties(objectiveProps, props);
}

export function getObjective(props?: Partial<IObjectiveProps>, id?: string): Objective {
  return Objective.create(getObjectiveProps(props), id).getValue();
}
