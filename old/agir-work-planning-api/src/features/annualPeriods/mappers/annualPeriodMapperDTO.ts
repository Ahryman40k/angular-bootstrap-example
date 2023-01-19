import {
  IAdditionalCost,
  IEnrichedProgramBook,
  IEnrichedProjectAnnualPeriod
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { IProgramBookMapperOptions, programBookMapperDTO } from '../../programBooks/mappers/programBookMapperDTO';
import { ProjectAnnualPeriod } from '../models/projectAnnualPeriod';
import { additionalCostMapperDTO } from './additionnalCostMapperDTO';

// tslint:disable:no-empty-interface
export interface IAnnualPeriodMapperOptions extends IProgramBookMapperOptions {}
class AnnualPeriodMapperDTO extends FromModelToDtoMappings<
  ProjectAnnualPeriod,
  IEnrichedProjectAnnualPeriod,
  IAnnualPeriodMapperOptions
> {
  protected async getFromNotNullModel(
    annualPeriod: ProjectAnnualPeriod,
    options: IAnnualPeriodMapperOptions
  ): Promise<IEnrichedProjectAnnualPeriod> {
    const [programBookDTO, additionalCostsDTO] = await Promise.all([
      programBookMapperDTO.getFromModel(annualPeriod.programBook, {
        ...options,
        hasAnnualProgram: true
      }),
      additionalCostMapperDTO.getFromModels(annualPeriod.additionalCosts)
    ]);
    return this.map(annualPeriod, programBookDTO, additionalCostsDTO);
  }

  private map(
    annualPeriod: ProjectAnnualPeriod,
    programBookDTO: IEnrichedProgramBook,
    additionalCostsDTO: IAdditionalCost[]
  ): IEnrichedProjectAnnualPeriod {
    return {
      rank: annualPeriod.rank,
      year: annualPeriod.year,
      programBookId: programBookDTO?.id,
      programBook: programBookDTO,
      status: annualPeriod.status,
      categoryId: annualPeriod.categoryId,
      annualBudget: annualPeriod.annualBudget,
      additionalCosts: additionalCostsDTO,
      additionalCostsTotalBudget: annualPeriod.additionalCostsTotalBudget,
      interventionIds: annualPeriod.interventionIds,
      interventionsTotalBudget: annualPeriod.interventionsTotalBudget,
      annualAllowance: annualPeriod.annualAllowance,
      accountId: annualPeriod.accountId
    };
  }
}

export const annualPeriodMapperDTO = new AnnualPeriodMapperDTO();
