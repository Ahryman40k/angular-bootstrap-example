import { AnnualProgramExpand } from '@villemontreal/agir-work-planning-lib/dist/src';

import { DeleteByUuidUseCase } from '../../../../shared/domain/useCases/deleteUseCase/deleteByUuidUseCase';
import { IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IAnnualProgramRepository } from '../../iAnnualProgramRepository';
import { AnnualProgram } from '../../models/annualProgram';
import { annualProgramRepository } from '../../mongo/annualProgramRepository';
import { AnnualProgramValidator } from '../../validators/annualProgramValidator';

export class DeleteAnnualProgramUseCase extends DeleteByUuidUseCase<AnnualProgram> {
  protected entityRepository: IAnnualProgramRepository = annualProgramRepository;

  protected async validateBusinessRules(annualProgram: AnnualProgram): Promise<Result<any>> {
    return AnnualProgramValidator.validateDeleteBusinessRules(annualProgram);
  }

  protected async validateAuthorization(): Promise<Result<IGuardResult>> {
    return AnnualProgramValidator.validateRestrictions(this.entity);
  }

  protected getExpands(): AnnualProgramExpand[] {
    return [AnnualProgramExpand.programBooks];
  }
}
export const deleteAnnualProgramUseCase = new DeleteAnnualProgramUseCase();
