import { configs } from '../../config/configs';
import { GdaServiceMock } from '../../tests/data/gdaServiceMock';
import { GdaService, IGdaService } from '../services/gdaService';

/**
 * The GDA service factory.
 * Holds a lazy singleton of the gda service.
 */
class GdaServiceFactory {
  private _service: IGdaService;
  public get service(): IGdaService {
    if (!this._service) {
      this._service = this.createService();
    }
    return this._service;
  }

  private createService(): IGdaService {
    return configs.gda.mock ? new GdaServiceMock() : new GdaService();
  }
}
export const gdaServiceFactory = new GdaServiceFactory();
