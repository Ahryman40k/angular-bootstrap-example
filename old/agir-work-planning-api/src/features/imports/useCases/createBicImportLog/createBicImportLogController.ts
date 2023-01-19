import { IBicImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { UseCaseController } from '../../../../shared/useCaseController';
import { CreateBicImportLogUseCase, createBicImportLogUseCase } from './createBicImportLogUseCase';

@autobind
export class CreateBicImportLogController extends UseCaseController<void, IBicImportLog> {
  protected readonly useCase: CreateBicImportLogUseCase = createBicImportLogUseCase;
  protected success = this.created;
  protected reqToInput(req: express.Request): void {
    return;
  }
}
