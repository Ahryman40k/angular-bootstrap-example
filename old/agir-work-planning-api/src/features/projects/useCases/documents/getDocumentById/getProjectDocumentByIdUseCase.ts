import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib';

import { GuardType } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  GetDocumentByIdCommand,
  IGetDocumentByIdCommandProps
} from '../../../../documents/useCases/getDocumentById/getDocumentByIdCommand';
import { GetDocumentByIdUseCase } from '../../../../documents/useCases/getDocumentById/getDocumentByIdUseCase';
import { IProjectRepository } from '../../../iProjectRepository';
import { projectRepository } from '../../../mongo/projectRepository';

export class GetProjectDocumentByIdUseCase extends GetDocumentByIdUseCase<IEnrichedProject> {
  protected entityRepository: IProjectRepository = projectRepository;
  protected createCommand(
    req: IGetDocumentByIdCommandProps
  ): Result<GetDocumentByIdCommand<IGetDocumentByIdCommandProps>> {
    return GetDocumentByIdCommand.create(req, GuardType.VALID_PROJECT_ID);
  }
}

export const getProjectDocumentByIdUseCase = new GetProjectDocumentByIdUseCase();
