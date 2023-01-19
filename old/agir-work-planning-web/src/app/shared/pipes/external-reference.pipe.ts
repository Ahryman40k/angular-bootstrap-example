import { Pipe, PipeTransform } from '@angular/core';
import { ExternalReferenceType, IExternalReferenceId } from '@villemontreal/agir-work-planning-lib/dist/src';

@Pipe({
  name: 'appExternalReference'
})
export class ExternalReferencePipe implements PipeTransform {
  public transform(externalReferenceIds: IExternalReferenceId[], externalReferenceType: ExternalReferenceType): string {
    const externalReferenceId = externalReferenceIds?.find(e => e.type === externalReferenceType);
    if (!externalReferenceId) {
      return null;
    }

    if (externalReferenceId?.type !== externalReferenceType) {
      throw new Error(`External reference type: ${externalReferenceId?.type} don't match ExternalReferenceType.`);
    }
    return externalReferenceId?.value;
  }
}
