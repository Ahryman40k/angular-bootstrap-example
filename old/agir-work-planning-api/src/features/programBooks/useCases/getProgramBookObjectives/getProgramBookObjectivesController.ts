import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import { Request } from 'express';
import { GetByIdController } from '../../../../shared/controllers/getByIdController';
import { IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { ProgramBook } from '../../models/programBook';
import { ProgramBookFindOneOptions } from '../../models/programBookFindOneOptions';
import { getProgramBookObjectivesUseCase, GetProgramBookObjectivesUseCase } from './getProgramBookObjectivesUseCase';

@autobind
export class GetProgramBookObjectivesController extends GetByIdController<
  ProgramBook,
  IEnrichedProgramBook, // should be IEnrichedObjective but we use the same useCase as getProgramBook
  ProgramBookFindOneOptions
> {
  protected useCase: GetProgramBookObjectivesUseCase = getProgramBookObjectivesUseCase;
  protected reqToInput(req: Request): IByIdCommandProps {
    return {
      id: req.params.programBookId,
      expand: req.query.expand
    };
  }
}
