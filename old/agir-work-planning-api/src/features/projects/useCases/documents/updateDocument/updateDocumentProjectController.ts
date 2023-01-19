import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { UpdateDocumentController } from '../../../../documents/useCases/updateDocument/updateDocumentController';
import { updateDocumentProjectUseCase, UpdateDocumentProjectUseCase } from './updateDocumentProjectUseCase';

@autobind
export class UpdateDocumentProjectController extends UpdateDocumentController<IEnrichedProject> {
  protected useCase: UpdateDocumentProjectUseCase = updateDocumentProjectUseCase;
}
