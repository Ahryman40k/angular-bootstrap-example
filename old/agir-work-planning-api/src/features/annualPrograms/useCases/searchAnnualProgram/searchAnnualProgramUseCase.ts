import { IEnrichedAnnualProgram } from '@villemontreal/agir-work-planning-lib';
import { SearchUseCase } from '../../../../shared/domain/useCases/searchUseCase/searchUseCase';
import { Result } from '../../../../shared/logic/result';
import { IAnnualProgramRepository } from '../../iAnnualProgramRepository';
import { annualProgramMapperDTO } from '../../mappers/annualProgramMapperDTO';
import { AnnualProgram } from '../../models/annualProgram';
import {
  AnnualProgramFindPaginatedOptions,
  IAnnualProgramFindPaginatedOptionsProps
} from '../../models/annualProgramFindPaginatedOptions';
import { annualProgramRepository } from '../../mongo/annualProgramRepository';
import { AnnualProgramValidator } from '../../validators/annualProgramValidator';

export class SearchAnnualProgramUseCase extends SearchUseCase<
  AnnualProgram,
  IEnrichedAnnualProgram,
  IAnnualProgramFindPaginatedOptionsProps
> {
  protected entityRepository: IAnnualProgramRepository = annualProgramRepository;
  protected mapper = annualProgramMapperDTO;

  protected createCommand(req: IAnnualProgramFindPaginatedOptionsProps): Result<AnnualProgramFindPaginatedOptions> {
    return AnnualProgramFindPaginatedOptions.create(req);
  }

  protected async validateTaxonomies(req: IAnnualProgramFindPaginatedOptionsProps): Promise<Result<any>> {
    if (req.criterias) {
      return AnnualProgramValidator.validateAgainstTaxonomies(req.criterias);
    }
    return Result.ok();
  }
}

export const searchAnnualProgramUseCase = new SearchAnnualProgramUseCase();
