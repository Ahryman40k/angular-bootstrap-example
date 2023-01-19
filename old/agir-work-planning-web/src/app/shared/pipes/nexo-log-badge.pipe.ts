import { Pipe, PipeTransform } from '@angular/core';
import { NexoImportStatus } from '@villemontreal/agir-work-planning-lib/dist/src';

@Pipe({ name: 'appNexoLogBadge' })
export class NexoLogBadge implements PipeTransform {
  public transform(status: NexoImportStatus): string {
    switch (status) {
      case NexoImportStatus.FAILURE:
        return 'badge-danger';
      case NexoImportStatus.PENDING:
        return 'badge-warning';
      case NexoImportStatus.SUCCESS:
        return 'badge-success';
      default:
        return 'badge-light';
    }
  }
}
