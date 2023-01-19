import { Pipe, PipeTransform } from '@angular/core';
import { IAudit } from '@villemontreal/agir-work-planning-lib/dist/src';

@Pipe({
  name: 'appAuditDateTime'
})
export class AuditDateTimePipe implements PipeTransform {
  public transform(audit: IAudit): string {
    return audit?.lastModifiedAt || audit?.createdAt;
  }
}
