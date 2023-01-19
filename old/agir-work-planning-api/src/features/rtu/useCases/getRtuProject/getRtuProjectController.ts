import { IRtuProject } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { GetByIdController } from '../../../../shared/controllers/getByIdController';
import { FindOptions } from '../../../../shared/findOptions/findOptions';
import { RtuProject } from '../../models/rtuProject';
import { GetRtuProjectUseCase, getRtuProjectUseCase } from './getRtuProjectUseCase';

@autobind
export class GetRtuProjectController extends GetByIdController<RtuProject, IRtuProject, FindOptions<any>> {
  protected useCase: GetRtuProjectUseCase = getRtuProjectUseCase;
}
