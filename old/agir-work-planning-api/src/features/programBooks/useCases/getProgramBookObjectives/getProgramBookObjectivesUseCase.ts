import { IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { GetProgramBookUseCase } from '../getProgramBook/getProgramBookUseCase';

export class GetProgramBookObjectivesUseCase extends GetProgramBookUseCase {
  public async execute(req: IByIdCommandProps): Promise<any> {
    // for now we use the same code as get programBookUseCase and only return objetives from result
    const result = await super.execute(req);
    if (result.isLeft()) {
      return result;
    }
    return right(Result.ok(result.value.getValue().objectives));
  }
}

export const getProgramBookObjectivesUseCase = new GetProgramBookObjectivesUseCase();
