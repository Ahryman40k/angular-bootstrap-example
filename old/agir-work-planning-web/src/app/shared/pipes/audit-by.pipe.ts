import { Pipe, PipeTransform } from '@angular/core';
import { IAudit } from '@villemontreal/agir-work-planning-lib/dist/src';

@Pipe({
  name: 'appAuditBy'
})
export class AuditByPipe implements PipeTransform {
  public transform(audit: IAudit): string {
    return audit?.lastModifiedBy?.displayName || audit?.createdBy.displayName;
  }
}
