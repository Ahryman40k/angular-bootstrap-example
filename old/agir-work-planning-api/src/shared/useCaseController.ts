import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { BaseController } from './baseController';
import { UseCase } from './domain/useCases/useCase';

@autobind
export abstract class UseCaseController<I, O> extends BaseController {
  protected readonly success: (res: express.Response, dto: O) => express.Response = this.ok;
  protected abstract readonly useCase: UseCase<I, O>;
  protected abstract reqToInput(req: express.Request): I;

  public async execute(req: express.Request, res: express.Response): Promise<any> {
    const result = await this.useCase.execute(this.reqToInput(req));

    if (result.isRight()) {
      return this.success(res, result.value.getValue());
    }
    if (result.isLeft()) {
      this.mapToApiError(result.value);
    }
  }
}
