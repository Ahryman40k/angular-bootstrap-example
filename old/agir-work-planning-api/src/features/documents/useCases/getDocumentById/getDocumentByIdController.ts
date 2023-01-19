import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { ByIdController } from '../../../../shared/controllers/byIdController';
import { IDownloadFileResult } from '../../../../shared/storage/iStorageService';
import { IGetDocumentByIdCommandProps } from './getDocumentByIdCommand';
import { GetDocumentByIdUseCase } from './getDocumentByIdUseCase';

@autobind
export abstract class GetDocumentByIdController<D> extends ByIdController<D> {
  protected abstract useCase: GetDocumentByIdUseCase<D>;
  protected reqToInput(req: express.Request): IGetDocumentByIdCommandProps {
    return {
      ...super.reqToInput(req),
      documentId: req.params.documentId
    };
  }
  public async execute(req: express.Request, res: express.Response): Promise<any> {
    const result = await this.useCase.execute(this.reqToInput(req));

    if (result.isRight()) {
      const document: IDownloadFileResult = result.value.getValue();
      res.status(HttpStatusCodes.OK);
      res.contentType(document.metadata.contentType);
      res.attachment(document.metadata.objectName);
      res.send(document.data);
    }
    if (result.isLeft()) {
      this.mapToApiError(result.value);
    }
  }
}
