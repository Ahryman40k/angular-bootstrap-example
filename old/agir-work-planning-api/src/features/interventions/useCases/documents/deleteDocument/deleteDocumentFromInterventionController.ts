import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { DeleteDocumentController } from '../../../../documents/useCases/deleteDocument/deleteDocumentController';
import {
  deleteDocumentFromInterventionUseCase,
  DeleteDocumentFromInterventionUseCase
} from './deleteDocumentFromInterventionUseCase';

@autobind
export class DeleteDocumentFromInterventionController extends DeleteDocumentController<IEnrichedIntervention> {
  protected useCase: DeleteDocumentFromInterventionUseCase = deleteDocumentFromInterventionUseCase;
}
