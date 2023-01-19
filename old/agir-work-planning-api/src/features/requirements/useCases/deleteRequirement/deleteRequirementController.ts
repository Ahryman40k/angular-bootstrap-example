import * as autobind from 'autobind-decorator';
import { DeleteByIdController } from '../../../../shared/controllers/deleteByIdController';
import { Requirement } from '../../models/requirement';
import { deleteRequirementUseCase, DeleteRequirementUseCase } from './deleteRequirementUseCase';

@autobind
export class DeleteRequirementController extends DeleteByIdController<Requirement> {
  protected useCase: DeleteRequirementUseCase = deleteRequirementUseCase;
}
