import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { AddDocumentController } from '../../../../documents/useCases/addDocument/addDocumentController';
import { AddDocumentToInterventionUseCase, addDocumentToInterventionUseCase } from './addDocumentToInterventionUseCase';

@autobind
export class AddDocumentToInterventionController extends AddDocumentController<IEnrichedIntervention> {
  protected useCase: AddDocumentToInterventionUseCase = addDocumentToInterventionUseCase;
}
