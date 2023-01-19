import { HttpMethods, IHandlerRoute } from '../../models/core/route';
import { VERSION } from '../../routes';
import { GetDiagnosticsInfoController } from './useCases/getDiagnosticInfo/getDiagnosticInfoController';

// tslint:disable:max-func-body-length
export function getDiagnosticsRoutes(): IHandlerRoute[] {
  return [
    {
      method: HttpMethods.GET,
      path: `${VERSION}/info`,
      handler: new GetDiagnosticsInfoController().execute
    }
  ];
}
