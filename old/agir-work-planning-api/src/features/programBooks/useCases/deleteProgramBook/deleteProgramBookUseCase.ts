import { ProgramBookExpand } from '@villemontreal/agir-work-planning-lib/dist/src';

import { DeleteByUuidUseCase } from '../../../../shared/domain/useCases/deleteUseCase/deleteByUuidUseCase';
import { IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IProgramBookRepository } from '../../iProgramBookRepository';
import { ProgramBook } from '../../models/programBook';
import { programBookRepository } from '../../mongo/programBookRepository';
import { ProgramBookValidator } from '../../validators/programBookValidator';

export class DeleteProgramBookUseCase extends DeleteByUuidUseCase<ProgramBook> {
  protected entityRepository: IProgramBookRepository = programBookRepository;

  protected getExpands(): string[] {
    return [ProgramBookExpand.projects, ProgramBookExpand.annualProgram];
  }

  protected async validateBusinessRules(programBook: ProgramBook): Promise<Result<any>> {
    return ProgramBookValidator.validateDeleteBusinessRules(programBook);
  }

  protected async validateAuthorization(): Promise<Result<IGuardResult>> {
    return ProgramBookValidator.validateRestrictions(this.entity.annualProgram.executorId, this.entity.boroughIds);
  }
}
export const deleteProgramBookUseCase = new DeleteProgramBookUseCase();
