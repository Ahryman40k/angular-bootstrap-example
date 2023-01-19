import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { AddDocumentController } from '../../../../documents/useCases/addDocument/addDocumentController';
import { AddDocumentToProjectUseCase, addDocumentToProjectUseCase } from './addDocumentToProjectUseCase';

@autobind
export class AddDocumentToProjectController extends AddDocumentController<IEnrichedProject> {
  protected useCase: AddDocumentToProjectUseCase = addDocumentToProjectUseCase;
}
