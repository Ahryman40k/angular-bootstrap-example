import { IDiagnosticsInfo } from '../../../models/core/diagnosticsInfo';
import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Result } from '../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IDiagnosticInfoProps extends IDiagnosticsInfo {}

export class DiagnosticInfo extends AggregateRoot<IDiagnosticInfoProps> {
  public static create(props: IDiagnosticInfoProps): Result<DiagnosticInfo> {
    const diagnosticInfo = new DiagnosticInfo(props, null);
    return Result.ok<DiagnosticInfo>(diagnosticInfo);
  }

  public get description(): string {
    return this.props.description;
  }

  public get name(): string {
    return this.props.name;
  }

  public get version(): string {
    return this.props.version;
  }
}
