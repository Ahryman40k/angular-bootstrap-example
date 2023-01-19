import { IComment } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { ByIdCommand, IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { ByIdUseCase } from '../../../../shared/domain/useCases/byIdUseCase';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { FindOptions } from '../../../../shared/findOptions/findOptions';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';

export abstract class GetCommentsUseCase<
  E extends any // E extends CommentableEntity, => when projects/interventions is refactorised
> extends ByIdUseCase<any, IComment[]> {
  // should extends ByIdUseCase<E>

  protected createCommand(req: IByIdCommandProps): Result<ByIdCommand<IByIdCommandProps>> {
    return ByIdCommand.create(req);
  }

  public async execute(req: IByIdCommandProps): Promise<any> {
    const cmdResult = this.createCommand(req);
    if (cmdResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(cmdResult)));
    }
    const getCmd: ByIdCommand<IByIdCommandProps> = cmdResult.getValue();

    this.entity = await this.entityRepository.findOne(
      FindOptions.create({
        criterias: {
          id: getCmd.id
        },
        fields: 'comments'
      }).getValue()
    );
    if (!this.entity) {
      return left(new NotFoundError(`Entity ${getCmd.id} was not found`));
    }

    // tslint:disable:no-string-literal
    const comments: IComment[] = !isEmpty(this.entity['comments']) ? this.entity['comments'] : [];
    // TODO should use commentMapperDTO but intervention and projects are not entities yet
    return right(Result.ok<IComment[]>(comments));
  }
}
