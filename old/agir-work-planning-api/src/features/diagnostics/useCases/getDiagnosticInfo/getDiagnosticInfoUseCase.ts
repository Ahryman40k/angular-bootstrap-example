import { IDiagnosticsInfo } from '../../../../models/core/diagnosticsInfo';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { errorMtlMapper } from '../../../../shared/domainErrors/errorMapperMtlApi';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { appUtils } from '../../../../utils/utils';
import { diagnosticInfoMapperDTO } from '../../mappers/diagnosticInfoMapperDTO';
import { DiagnosticInfo, IDiagnosticInfoProps } from '../../models/diagnosticInfo';

export class GetDiagnosticsInfoUseCase extends UseCase<IDiagnosticInfoProps, IDiagnosticsInfo> {
  public async execute(): Promise<Response<IDiagnosticsInfo>> {
    const resultPackageJson = await appUtils.getPackageJson();
    if (resultPackageJson.isFailure) {
      throw errorMtlMapper.toApiError(new UnexpectedError(resultPackageJson));
    }
    const packageJson = resultPackageJson.getValue();
    const diagnosticInfo = DiagnosticInfo.create({
      description: packageJson.description,
      name: packageJson.name,
      version: packageJson.version
    });
    return right(Result.ok<IDiagnosticsInfo>(await diagnosticInfoMapperDTO.getFromModel(diagnosticInfo.getValue())));
  }
}

export const getDiagnosticsInfoUseCase = new GetDiagnosticsInfoUseCase();
