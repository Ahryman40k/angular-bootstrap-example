import { isNil } from 'lodash';
import * as mongoose from 'mongoose';

import { convertIdsToString } from '../utils/convertIdsToStringUtils';

export function convertIdsToObjectIds(schema: mongoose.Schema, idsProperty: string[]): void {
  // tslint:disable-next-line: only-arrow-functions tslint:disable-next-line: ter-prefer-arrow-callback
  schema.post('aggregate', function(docs): void {
    for (const doc of docs as any) {
      convertDocPropToString(doc);
    }
  });

  // tslint:disable-next-line: only-arrow-functions tslint:disable-next-line: ter-prefer-arrow-callback
  schema.post('find', function(docs): void {
    for (const doc of docs as any) {
      convertDocPropToString(doc);
    }
  });

  // tslint:disable-next-line: only-arrow-functions tslint:disable-next-line: ter-prefer-arrow-callback
  schema.post('findOne', function(doc): void {
    convertDocPropToString(doc);
  });

  function convertDocPropToString(doc: any) {
    if (isNil(doc)) {
      return;
    }
    convertIdsToString(doc, idsProperty, (id: mongoose.Types.ObjectId) => id.toString());
  }
}
