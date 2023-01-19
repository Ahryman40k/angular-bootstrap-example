import { isEmpty } from 'lodash';
import { IEnrichedAnnualProgram } from '../planning';

export interface IAnnualProgramService {
  canDeleteAnnualProgram(annualProgram: IEnrichedAnnualProgram): boolean;
}
export class BaseAnnualProgramService implements IAnnualProgramService {
  /**
   * Returns whether the annual program can be deleted.
   * Program books must be loaded in the annual program in order to have the correct behavior.
   * @param annualProgram The annual program.
   */
  public canDeleteAnnualProgram(annualProgram: IEnrichedAnnualProgram): boolean {
    return isEmpty(annualProgram.programBooks);
  }
}
