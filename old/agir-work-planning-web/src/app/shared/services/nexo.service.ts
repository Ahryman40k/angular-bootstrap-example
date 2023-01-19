import { Injectable } from '@angular/core';

export enum ExternalReferenceIdType {
  nexoAssetId = 'nexoAssetId',
  nexoReferenceNumber = 'nexoReferenceNumber'
}

@Injectable({
  providedIn: 'root'
})
export class NexoService {
  public static getExternalReferenceIdByTypes(object: any, types: ExternalReferenceIdType[]): string {
    if (object.externalReferenceIds) {
      for (const type of types) {
        const value = object.externalReferenceIds?.find(referenceId => referenceId.type === type)?.value;
        if (value) {
          return value;
        }
      }
    }
    return null;
  }
}
