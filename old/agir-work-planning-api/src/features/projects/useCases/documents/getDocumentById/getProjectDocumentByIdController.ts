import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { GetDocumentByIdController } from '../../../../documents/useCases/getDocumentById/getDocumentByIdController';
import { getProjectDocumentByIdUseCase, GetProjectDocumentByIdUseCase } from './getProjectDocumentByIdUseCase';

@autobind
export class GetProjectDocumentByIdController extends GetDocumentByIdController<IEnrichedProject> {
  protected useCase: GetProjectDocumentByIdUseCase = getProjectDocumentByIdUseCase;
}
