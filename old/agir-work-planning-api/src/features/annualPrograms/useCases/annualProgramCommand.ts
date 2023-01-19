import { IPlainAnnualProgramProps, PlainAnnualProgram } from '../models/plainAnnualProgram';

// tslint:disable:no-empty-interface
export interface IAnnualProgramCommandProps extends IPlainAnnualProgramProps {}

export abstract class AnnualProgramCommand<P extends IAnnualProgramCommandProps> extends PlainAnnualProgram<P> {}
