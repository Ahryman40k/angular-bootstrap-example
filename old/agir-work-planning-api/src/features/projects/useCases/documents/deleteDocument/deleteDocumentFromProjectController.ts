import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { DeleteDocumentController } from '../../../../documents/useCases/deleteDocument/deleteDocumentController';
import { deleteDocumentFromProjectUseCase, DeleteDocumentFromProjectUseCase } from './deleteDocumentFromProjectUseCase';

@autobind
export class DeleteDocumentFromProjectController extends DeleteDocumentController<IEnrichedProject> {
  protected useCase: DeleteDocumentFromProjectUseCase = deleteDocumentFromProjectUseCase;
}
