import { IEnrichedProgramBook, Permission, ProgramBookStatus } from '@villemontreal/agir-work-planning-lib';

import { userService } from '../../../../services/userService';
import { SearchUseCase } from '../../../../shared/domain/useCases/searchUseCase/searchUseCase';
import { IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IProgramBookRepository } from '../../iProgramBookRepository';
import { programBookMapperDTO } from '../../mappers/programBookMapperDTO';
import { ProgramBook } from '../../models/programBook';
import {
  IProgramBookPaginatedFindOptionsProps,
  ProgramBookFindPaginatedOptions
} from '../../models/programBookFindPaginatedOptions';
import { programBookRepository } from '../../mongo/programBookRepository';

export class SearchProgramBooksUseCase extends SearchUseCase<
  ProgramBook,
  IEnrichedProgramBook,
  IProgramBookPaginatedFindOptionsProps
> {
  protected entityRepository: IProgramBookRepository = programBookRepository;
  protected mapper = programBookMapperDTO;

  protected async validatePermissions(options: IProgramBookPaginatedFindOptionsProps): Promise<Result<IGuardResult>> {
    const user = userService.currentUser;
    if (
      !user.hasPermission(Permission.PROGRAM_BOOK_READ_NEW) &&
      options.criterias.status.includes(ProgramBookStatus.new)
    ) {
      return Result.fail(`You are not allowed to filter by status: ${ProgramBookStatus.new}.`);
    }
    return Result.ok();
  }

  protected createCommand(req: IProgramBookPaginatedFindOptionsProps): Result<ProgramBookFindPaginatedOptions> {
    return ProgramBookFindPaginatedOptions.create(req);
  }

  protected getMapperOptions(options: ProgramBookFindPaginatedOptions) {
    return {
      ...super.getMapperOptions(options),
      projectLimit: Number(options.props.criterias?.projectLimit),
      projectOffset: Number(options.props.criterias?.projectOffset)
    };
  }
}

export const searchProgramBooksUseCase = new SearchProgramBooksUseCase();
