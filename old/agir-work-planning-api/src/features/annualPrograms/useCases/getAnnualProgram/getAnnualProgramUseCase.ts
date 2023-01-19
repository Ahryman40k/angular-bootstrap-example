import { IEnrichedAnnualProgram } from '@villemontreal/agir-work-planning-lib';

import { ByUuidCommand } from '../../../../shared/domain/useCases/byUuidCommand';
import { GetByUuidUseCase } from '../../../../shared/domain/useCases/getByIdUseCase/getByUuidUseCase';
import { Result } from '../../../../shared/logic/result';
import { IAnnualProgramRepository } from '../../iAnnualProgramRepository';
import { annualProgramMapperDTO } from '../../mappers/annualProgramMapperDTO';
import { AnnualProgram } from '../../models/annualProgram';
import { AnnualProgramFindOneOptions } from '../../models/annualProgramFindOneOptions';
import { annualProgramRepository } from '../../mongo/annualProgramRepository';

export class GetAnnualProgramUseCase extends GetByUuidUseCase<
  AnnualProgram,
  IEnrichedAnnualProgram,
  AnnualProgramFindOneOptions
> {
  protected entityRepository: IAnnualProgramRepository = annualProgramRepository;
  protected mapper = annualProgramMapperDTO;

  protected getFindOptions(byIdCmd: ByUuidCommand): Result<AnnualProgramFindOneOptions> {
    return AnnualProgramFindOneOptions.create({
      criterias: {
        id: byIdCmd.id
      },
      expand: byIdCmd.expand,
      fields: byIdCmd.fields
    });
  }
}

export const getAnnualProgramUseCase = new GetAnnualProgramUseCase();
