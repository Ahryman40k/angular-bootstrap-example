import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { IDiagnosticsInfo } from '../../../../models/core/diagnosticsInfo';
import { UseCaseController } from '../../../../shared/useCaseController';
import { GetDiagnosticsInfoUseCase, getDiagnosticsInfoUseCase } from './getDiagnosticInfoUseCase';

@autobind
export class GetDiagnosticsInfoController extends UseCaseController<void, IDiagnosticsInfo> {
  protected readonly useCase: GetDiagnosticsInfoUseCase = getDiagnosticsInfoUseCase;

  protected reqToInput(req: express.Request): void {
    return;
  }
}
