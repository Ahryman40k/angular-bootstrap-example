import { IPlainProgramBookProps, PlainProgramBook } from '../models/plainProgramBook';

// tslint:disable:no-empty-interface
export interface IProgramBookCommandProps extends IPlainProgramBookProps {}

export abstract class ProgramBookCommand<P extends IProgramBookCommandProps> extends PlainProgramBook<P> {}
