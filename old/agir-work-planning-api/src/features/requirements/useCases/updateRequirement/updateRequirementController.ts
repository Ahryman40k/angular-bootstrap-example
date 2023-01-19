import { IRequirement } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { UpdateController } from '../../../../shared/controllers/updateController';
import { IUpdateRequirementCommandProps } from './updateRequirementCommand';
import { updateRequirementUseCase } from './updateRequirementUseCase';

@autobind
export class UpdateRequirementController extends UpdateController<IUpdateRequirementCommandProps, IRequirement> {
  protected readonly useCase = updateRequirementUseCase;
}
