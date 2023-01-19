import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib';

import { IByIdCommandProps } from '../../../../../shared/domain/useCases/byIdCommand';
import { Result } from '../../../../../shared/logic/result';
import { GetCommentsUseCase } from '../../../../comments/useCases/getComments/getCommentsUseCase';
import { IProjectRepository } from '../../../iProjectRepository';
import { projectRepository } from '../../../mongo/projectRepository';
import { ByProjectIdCommand } from '../../byProjectIdCommand';

export class GetProjectCommentsUseCase extends GetCommentsUseCase<IEnrichedProject> {
  protected entityRepository: IProjectRepository = projectRepository;
  protected createCommand(req: IByIdCommandProps): Result<ByProjectIdCommand<IByIdCommandProps>> {
    return ByProjectIdCommand.create(req);
  }
}

export const getProjectCommentsUseCase = new GetProjectCommentsUseCase();
