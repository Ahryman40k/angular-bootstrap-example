import { IDrmProject } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { CreateController } from '../../../../../shared/controllers/createController';
import { IInputDrmProjectProps } from '../../../models/drm/inputDrmNumber';
import { GenerateDrmNumberUseCase, generateDrmNumberUseCase } from './generateDrmNumberUseCase';

@autobind
export class GenerateDrmNumberController extends CreateController<IInputDrmProjectProps, IDrmProject[]> {
  protected success = this.ok;
  protected readonly useCase: GenerateDrmNumberUseCase = generateDrmNumberUseCase;
}
