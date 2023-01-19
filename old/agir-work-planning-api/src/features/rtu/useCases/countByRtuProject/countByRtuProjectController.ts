import * as autobind from 'autobind-decorator';
import { CountByController } from '../../../../shared/controllers/countByController';
import { RtuProject } from '../../models/rtuProject';
import { IRtuProjectFindOptionsProps } from '../../models/rtuProjectFindOptions';
import { countByRtuProjectUseCase, CountByRtuProjectUseCase } from './countByRtuProjectUseCase';

@autobind
export class CountByRtuProjectController extends CountByController<RtuProject, IRtuProjectFindOptionsProps> {
  protected useCase: CountByRtuProjectUseCase = countByRtuProjectUseCase;
}
