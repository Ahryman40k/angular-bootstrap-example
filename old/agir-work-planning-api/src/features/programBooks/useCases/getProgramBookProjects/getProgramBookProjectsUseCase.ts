import { IEnrichedProject, ProgramBookExpand } from '@villemontreal/agir-work-planning-lib';
import { ByIdCommand, IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { ByUuidCommand } from '../../../../shared/domain/useCases/byUuidCommand';
import { GetByIdUseCase } from '../../../../shared/domain/useCases/getByIdUseCase/getByIdUseCase';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { FindOne, IFindOneProps } from '../../../../shared/findOptions/findOne';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { IProgramBookRepository } from '../../iProgramBookRepository';
import { programBookRepository } from '../../mongo/programBookRepository';

export class GetProgramBookProjectsUseCase extends GetByIdUseCase<any, IEnrichedProject, FindOne<IFindOneProps>> {
  protected entityRepository: IProgramBookRepository = programBookRepository;
  protected mapper: any = undefined;

  public async execute(req: IByIdCommandProps): Promise<any> {
    const byIdCmdResult = ByUuidCommand.create(req);
    if (byIdCmdResult.isFailure) {
      return left(new InvalidParameterError(Result.combine([byIdCmdResult]).error));
    }
    const byIdCmd: ByIdCommand<IByIdCommandProps> = byIdCmdResult.getValue();

    const programBook = await this.entityRepository.findById(byIdCmd.id, [ProgramBookExpand.projects]);
    if (!programBook) {
      return left(new NotFoundError(`ProgramBook ${byIdCmd.id} was not found`));
    }

    return right(Result.ok<IEnrichedProject[]>(programBook.projects));
  }
}

export const getProgramBookProjectsUseCase = new GetProgramBookProjectsUseCase();
