import { IRequirement } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { CreateController } from '../../../../shared/controllers/createController';
import { IPlainRequirementProps } from '../../models/plainRequirement';
import { CreateRequirementUseCase, createRequirementUseCase } from './createRequirementUseCase';

@autobind
export class CreateRequirementController extends CreateController<IPlainRequirementProps, IRequirement> {
  protected readonly useCase: CreateRequirementUseCase = createRequirementUseCase;
}
