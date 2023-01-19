import { Component, Input, OnChanges } from '@angular/core';
import { IRtuExportLog, IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';
import { RtuTransmissionStatus } from 'src/app/shared/models/rtu-transmissions/rtu-transmission-status';

@Component({
  selector: 'app-transmission-status-badge',
  templateUrl: './transmission-status-badge.component.html',
  styleUrls: ['./transmission-status-badge.component.css']
})
export class TransmissionStatusBadgeComponent implements OnChanges {
  @Input() public transmission: IRtuExportLog | IRtuImportLog;

  public badgeClass: string;
  public badgeLabel: string;

  public ngOnChanges(): void {
    if (this.transmission) {
      switch (this.transmission.status) {
        case RtuTransmissionStatus.successful:
          this.badgeClass = 'badge-success';
          this.badgeLabel = 'Succès';
          break;
        case RtuTransmissionStatus.failure:
          this.badgeClass = 'badge-danger';
          this.badgeLabel = 'Échec';
          break;
        case RtuTransmissionStatus.inProgress:
        default:
          this.badgeClass = 'badge-light';
          this.badgeLabel = 'En cours';
      }
    }
  }
}
