import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { UpdateDocumentController } from '../../../../documents/useCases/updateDocument/updateDocumentController';
import {
  UpdateDocumentInterventionUseCase,
  updateDocumentInterventionUseCase
} from './updateDocumentInterventionUseCase';

@autobind
export class UpdateDocumentInterventionController extends UpdateDocumentController<IEnrichedIntervention> {
  protected useCase: UpdateDocumentInterventionUseCase = updateDocumentInterventionUseCase;
}
