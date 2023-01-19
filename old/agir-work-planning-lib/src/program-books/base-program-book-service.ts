import * as _ from 'lodash';

import { IEnrichedProgramBook } from '../planning';
import { ProgramBookStatus } from './program-book-status';

export interface IProgramBookService {
  canDeleteProgramBook(programBook: IEnrichedProgramBook): boolean;
}

export class BaseProgramBookService implements IProgramBookService {
  /**
   * Returns whether the program book can be deleted.
   * Projects must be loaded in the program book in order to have the correct behavior.
   * @param programBook The program book.
   */
  public canDeleteProgramBook(programBook: IEnrichedProgramBook): boolean {
    const compatibleStatuses = [
      ProgramBookStatus.new,
      ProgramBookStatus.programming,
      ProgramBookStatus.submittedPreliminary
    ];
    const priorityScenario = programBook.priorityScenarios[0];
    return (
      priorityScenario &&
      priorityScenario.orderedProjects &&
      priorityScenario.orderedProjects.paging.totalCount === 0 &&
      _.includes(compatibleStatuses, programBook.status as ProgramBookStatus)
    );
  }
}
