import { IDiagnosticsInfo } from '../../../models/core/diagnosticsInfo';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { DiagnosticInfo } from '../models/diagnosticInfo';

class DiagnosticInfoMapperDTO extends FromModelToDtoMappings<DiagnosticInfo, IDiagnosticsInfo, void> {
  protected async getFromNotNullModel(diagnosticInfo: DiagnosticInfo): Promise<IDiagnosticsInfo> {
    return this.map(diagnosticInfo);
  }

  private map(diagnosticInfo: DiagnosticInfo): IDiagnosticsInfo {
    return {
      description: diagnosticInfo.description,
      name: diagnosticInfo.name,
      version: diagnosticInfo.version
    };
  }
}

export const diagnosticInfoMapperDTO = new DiagnosticInfoMapperDTO();
