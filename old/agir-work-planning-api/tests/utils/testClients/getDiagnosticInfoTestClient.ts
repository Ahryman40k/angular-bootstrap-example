import { constants, EndpointTypes } from '../../../config/constants';
import { IDiagnosticsInfo } from '../../../src/models/core/diagnosticsInfo';
import { appUtils } from '../../../src/utils/utils';
import { requestService } from '../requestService';
import { ITestClientResponse } from './_testClientResponse';

class DiagnosticInfoTestClient {
  private readonly diagnosticInfoUrl = appUtils.createPublicFullPath(
    constants.locationPaths.GET_DIAGNOSTICS_INFO,
    EndpointTypes.API
  );

  public get(): Promise<ITestClientResponse<IDiagnosticsInfo>> {
    return requestService.get(`${this.diagnosticInfoUrl}`);
  }
}
export const diagnosticInfoTestClient = new DiagnosticInfoTestClient();
