import * as autobind from 'autobind-decorator';
import { UpsertDocumentController } from '../upsertDocument/upsertDocumentController';

@autobind
export abstract class AddDocumentController<E extends any> extends UpsertDocumentController<E> {
  // E extends Entity<any> Documentable
  protected success = this.created;
}
