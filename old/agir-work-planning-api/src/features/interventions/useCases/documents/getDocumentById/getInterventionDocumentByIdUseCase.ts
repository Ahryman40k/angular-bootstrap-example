import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib';

import { GuardType } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  GetDocumentByIdCommand,
  IGetDocumentByIdCommandProps
} from '../../../../documents/useCases/getDocumentById/getDocumentByIdCommand';
import { GetDocumentByIdUseCase } from '../../../../documents/useCases/getDocumentById/getDocumentByIdUseCase';
import { IInterventionRepository } from '../../../iInterventionRepository';
import { interventionRepository } from '../../../mongo/interventionRepository';

export class GetInterventionDocumentByIdUseCase extends GetDocumentByIdUseCase<IEnrichedIntervention> {
  protected entityRepository: IInterventionRepository = interventionRepository;
  protected createCommand(
    req: IGetDocumentByIdCommandProps
  ): Result<GetDocumentByIdCommand<IGetDocumentByIdCommandProps>> {
    return GetDocumentByIdCommand.create(req, GuardType.VALID_INTERVENTION_ID);
  }
}

export const getInterventionDocumentByIdUseCase = new GetInterventionDocumentByIdUseCase();
