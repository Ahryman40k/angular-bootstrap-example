import { IConflictualItem } from '@villemontreal/agir-work-planning-lib/dist/src';

export interface IRquirement {
  typeId: string;
  subtypeId: string;
  text: string;
  items?: IConflictualItem[];
}
