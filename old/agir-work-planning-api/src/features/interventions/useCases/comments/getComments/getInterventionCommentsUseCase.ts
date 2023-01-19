import { IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib';

import { IByIdCommandProps } from '../../../../../shared/domain/useCases/byIdCommand';
import { Result } from '../../../../../shared/logic/result';
import { GetCommentsUseCase } from '../../../../comments/useCases/getComments/getCommentsUseCase';
import { IInterventionRepository } from '../../../iInterventionRepository';
import { interventionRepository } from '../../../mongo/interventionRepository';
import { ByInterventionIdCommand } from '../../byInterventionIdCommand';

export class GetInterventionCommentsUseCase extends GetCommentsUseCase<IEnrichedIntervention> {
  protected entityRepository: IInterventionRepository = interventionRepository;
  protected createCommand(req: IByIdCommandProps): Result<ByInterventionIdCommand<IByIdCommandProps>> {
    return ByInterventionIdCommand.create(req);
  }
}

export const getInterventionCommentsUseCase = new GetInterventionCommentsUseCase();
