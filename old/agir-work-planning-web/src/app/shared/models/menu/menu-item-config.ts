import {
  IEnrichedAnnualProgram,
  IEnrichedProgramBook,
  IOrderedProject
} from '@villemontreal/agir-work-planning-lib/dist/src';

export interface IMenuItemConfig {
  addPriorityService?: boolean;
  changeProjectRank?: boolean;
  consultSequencingNotes?: boolean;
  hiddenMenuItems?: string[];
  newWindow?: boolean;
  orderedProject?: IOrderedProject;
  programBook?: IEnrichedProgramBook;
  annualProgram?: IEnrichedAnnualProgram;
  removeProjectManualRank?: boolean;
  disableAddProjectToProgramBook?: boolean;
  compatibleAnnualPrograms?: IEnrichedAnnualProgram[];
}
