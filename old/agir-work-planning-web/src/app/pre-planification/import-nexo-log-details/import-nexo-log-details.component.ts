import { Component, Input } from '@angular/core';
import {
  INexoImportLog,
  NexoFileType,
  NexoImportStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { ImportNexoService } from '../../shared/services/import-nexo.service';

@Component({
  selector: 'app-import-nexo-log-details',
  templateUrl: './import-nexo-log-details.component.html',
  styleUrls: ['./import-nexo-log-details.component.scss']
})
export class ImportNexoLogDetailsComponent {
  @Input() public nexoImportLog: INexoImportLog;

  public NexoImportStatus = NexoImportStatus;
  public TaxonomyGroup = TaxonomyGroup;
  public NexoFileType = NexoFileType;
  constructor(private readonly importNexoService: ImportNexoService) {}

  public async downloadImportResults(): Promise<void> {
    await this.importNexoService.downloadNexoImportResults(this.nexoImportLog);
  }
}
