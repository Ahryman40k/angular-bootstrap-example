import { IEnrichedProgramBook, ProgramBookExpand } from '@villemontreal/agir-work-planning-lib/dist/src';

import { ByUuidCommand, IByUuidCommandProps } from '../../../../shared/domain/useCases/byUuidCommand';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { programBookMapperDTO } from '../../../programBooks/mappers/programBookMapperDTO';
import { ProgramBook } from '../../../programBooks/models/programBook';
import { ProgramBookFindOptions } from '../../../programBooks/models/programBookFindOptions';
import { programBookRepository } from '../../../programBooks/mongo/programBookRepository';
import { annualProgramRepository } from '../../mongo/annualProgramRepository';

export class GetAnnualProgramProgramBooksUseCase extends UseCase<IByUuidCommandProps, IEnrichedProgramBook[]> {
  public async execute(req: IByUuidCommandProps): Promise<Response<IEnrichedProgramBook[]>> {
    const byUuidResult = ByUuidCommand.create(req);

    if (byUuidResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(byUuidResult)));
    }
    const byUuid = byUuidResult.getValue();
    const annualProgram = await annualProgramRepository.findById(byUuid.id);
    if (!annualProgram) {
      return left(new NotFoundError(`AnnualProgram with id ${byUuid.id} was not found`));
    }

    const programBookFindOptionsResult = ProgramBookFindOptions.create({
      criterias: {
        annualProgramId: byUuid.id
      },
      expand: byUuid.expand,
      fields: byUuid.fields
    });
    if (programBookFindOptionsResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(programBookFindOptionsResult)));
    }

    const programBooks: ProgramBook[] = await programBookRepository.findAll(programBookFindOptionsResult.getValue());
    const expand: ProgramBookExpand[] = [];
    programBookFindOptionsResult.getValue().expandOptions.forEach(option => {
      if (option.field === ProgramBookExpand.removedProjects) {
        expand.push(ProgramBookExpand.removedProjects);
      }
      if (option.field === ProgramBookExpand.projects) {
        expand.push(ProgramBookExpand.projects);
      }
    });
    return right(
      Result.ok<IEnrichedProgramBook[]>(
        await programBookMapperDTO.getFromModels(programBooks, {
          hasAnnualProgram: false,
          fields: programBookFindOptionsResult.getValue().fields,
          expand
        })
      )
    );
  }
}
export const getAnnualProgramProgramBooksUseCase = new GetAnnualProgramProgramBooksUseCase();
