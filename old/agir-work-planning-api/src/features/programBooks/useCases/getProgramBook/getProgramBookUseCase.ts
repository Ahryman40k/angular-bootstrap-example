import { IEnrichedProgramBook, ProgramBookExpand } from '@villemontreal/agir-work-planning-lib';

import { ByUuidCommand } from '../../../../shared/domain/useCases/byUuidCommand';
import { GetByUuidUseCase } from '../../../../shared/domain/useCases/getByIdUseCase/getByUuidUseCase';
import { Result } from '../../../../shared/logic/result';
import { IProgramBookRepository } from '../../iProgramBookRepository';
import { IProgramBookMapperOptions, programBookMapperDTO } from '../../mappers/programBookMapperDTO';
import { ProgramBook } from '../../models/programBook';
import { ProgramBookFindOneOptions } from '../../models/programBookFindOneOptions';
import { programBookRepository } from '../../mongo/programBookRepository';

export class GetProgramBookUseCase extends GetByUuidUseCase<
  ProgramBook,
  IEnrichedProgramBook,
  ProgramBookFindOneOptions
> {
  protected entityRepository: IProgramBookRepository = programBookRepository;
  protected mapper = programBookMapperDTO;

  protected getFindOptions(byIdCmd: ByUuidCommand): Result<ProgramBookFindOneOptions> {
    return ProgramBookFindOneOptions.create({
      criterias: {
        id: byIdCmd.id
      },
      expand: byIdCmd.expand
    });
  }

  protected getMapperOptions(options: ProgramBookFindOneOptions): IProgramBookMapperOptions {
    return {
      ...super.getMapperOptions(options),
      hasAnnualProgram: options?.expandOptions.map(e => e.field).includes(ProgramBookExpand.annualProgram)
    };
  }
}

export const getProgramBookUseCase = new GetProgramBookUseCase();
