import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { GetDocumentByIdController } from '../../../../documents/useCases/getDocumentById/getDocumentByIdController';
import {
  getInterventionDocumentByIdUseCase,
  GetInterventionDocumentByIdUseCase
} from './getInterventionDocumentByIdUseCase';

@autobind
export class GetInterventionDocumentByIdController extends GetDocumentByIdController<IEnrichedIntervention> {
  protected useCase: GetInterventionDocumentByIdUseCase = getInterventionDocumentByIdUseCase;
}
