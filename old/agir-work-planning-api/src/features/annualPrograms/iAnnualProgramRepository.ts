import { IBaseRepository } from '../../repositories/core/baseRepository';
import { AnnualProgram } from './models/annualProgram';
import { AnnualProgramFindOptions } from './models/annualProgramFindOptions';

export interface IAnnualProgramRepository extends IBaseRepository<AnnualProgram, AnnualProgramFindOptions> {}
