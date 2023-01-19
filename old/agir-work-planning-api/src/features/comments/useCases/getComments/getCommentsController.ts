import * as autobind from 'autobind-decorator';
import { ByIdController } from '../../../../shared/controllers/byIdController';
import { GetCommentsUseCase } from './getCommentsUseCase';

@autobind
export abstract class GetCommentsController<D> extends ByIdController<D> {
  protected abstract useCase: GetCommentsUseCase<D>;
}
