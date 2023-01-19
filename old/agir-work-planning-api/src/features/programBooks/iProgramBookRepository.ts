import { IBaseRepository } from '../../repositories/core/baseRepository';
import { ProgramBook } from './models/programBook';
import { ProgramBookFindOptions } from './models/programBookFindOptions';
import { IProgramBookMongoAttributes } from './mongo/programBookSchema';

// tslint:disable:no-empty-interface
export interface IProgramBookRepository extends IBaseRepository<ProgramBook, ProgramBookFindOptions> {
  toDomainModel(raw: IProgramBookMongoAttributes, expand?: string[]): Promise<ProgramBook>;
}
