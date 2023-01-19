import {
  IConflictualItem,
  IEnrichedIntervention,
  IEnrichedProject
} from '@villemontreal/agir-work-planning-lib/dist/src';

export interface IConflictualItemObject extends IConflictualItem {
  data: IEnrichedProject | IEnrichedIntervention;
}
