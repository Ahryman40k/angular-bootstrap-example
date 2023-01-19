import { AnnualProgramStatus, ProgramBookStatus } from '@villemontreal/agir-work-planning-lib';

import { errorMtlMapper } from '../../shared/domainErrors/errorMapperMtlApi';
import { UnexpectedError } from '../../shared/domainErrors/unexpectedError';
import { Result } from '../../shared/logic/result';
import { appUtils, IKeyAndValue } from '../../utils/utils';
import { IPlainProgramBookProps, PlainProgramBook } from '../programBooks/models/plainProgramBook';
import { ProgramBook } from '../programBooks/models/programBook';
import { annualProgramStateMachine } from './annualProgramStateMachine';
import { AnnualProgram } from './models/annualProgram';
import { annualProgramRepository } from './mongo/annualProgramRepository';

export interface IAnnualProgramService {
  syncAnnualProgramStatus(programBooks: ProgramBook[]): Promise<void>;
  updateStatusWithProgramBook(
    annualProgram: AnnualProgram,
    programBook: PlainProgramBook<IPlainProgramBookProps>
  ): Promise<Result<AnnualProgram>>;
}

class AnnualProgramService implements IAnnualProgramService {
  public async updateStatusWithProgramBook(
    annualProgram: AnnualProgram,
    programBook: PlainProgramBook<IPlainProgramBookProps>
  ): Promise<Result<AnnualProgram>> {
    if (
      programBook.status === ProgramBookStatus.programming &&
      annualProgram.status !== AnnualProgramStatus.programming
    ) {
      return annualProgramStateMachine.execute(annualProgram, AnnualProgramStatus.programming);
    }
    return Result.ok();
  }

  /**
   * Syncs the annual program status with its program books.
   * The rule is if at least one program book has the status, then the annual program takes it.
   * The statuses need to be in order.
   * @param annualProgram The annual program
   * @param programBooks The program books of the annual program
   */
  public async syncAnnualProgramStatus(programBooks: ProgramBook[] = []): Promise<void> {
    // group program books by annualPrograms ids
    const groupedByAnnualPrograms: IKeyAndValue<ProgramBook[]> = appUtils.groupArrayToObject<ProgramBook>(
      'annualProgram.id',
      programBooks
    );
    for (const programBooksByAnnualProgram of Object.values(groupedByAnnualPrograms)) {
      const annualProgram: AnnualProgram = programBooksByAnnualProgram.find(pb => pb).annualProgram;

      const statuses = [ProgramBookStatus.new, ProgramBookStatus.programming];
      for (const status of statuses) {
        if (programBooksByAnnualProgram.some(pb => pb.status === status)) {
          await annualProgramStateMachine.execute(annualProgram, this.getStatusByProgramBookStatus(status));
        }
      }
      const result = await annualProgramRepository.save(annualProgram);
      if (result.isFailure) {
        throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(result)));
      }
    }
  }

  private getStatusByProgramBookStatus(programBookStatus: ProgramBookStatus): AnnualProgramStatus {
    switch (programBookStatus) {
      case ProgramBookStatus.new:
        return AnnualProgramStatus.new;
      case ProgramBookStatus.programming:
        return AnnualProgramStatus.programming;
      default:
        throw new Error(`AnnualProgram has no programbook status matching ${programBookStatus}`);
    }
  }
}

export const annualProgramService: IAnnualProgramService = new AnnualProgramService();
