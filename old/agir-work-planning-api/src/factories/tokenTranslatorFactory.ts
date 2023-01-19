import { configs } from '../../config/configs';
import { TokenTranslatorServiceMock } from '../../tests/data/tokenTranslatorServiceMock';
import { ITokenTranslatorService, TokenTranslatorService } from '../services/tokenTranslatorService';

/**
 * The token translator factory.
 * Holds a lazy singleton of the token translator service.
 */
class TokenTranslatorFactory {
  private _service: ITokenTranslatorService;
  public get service(): ITokenTranslatorService {
    if (!this._service) {
      this._service = this.createService();
    }
    return this._service;
  }

  private createService(): ITokenTranslatorService {
    return configs.security.jwt.endPoints.tokenTranslator.mock
      ? new TokenTranslatorServiceMock()
      : new TokenTranslatorService();
  }
}
export const tokenTranslatorFactory = new TokenTranslatorFactory();
