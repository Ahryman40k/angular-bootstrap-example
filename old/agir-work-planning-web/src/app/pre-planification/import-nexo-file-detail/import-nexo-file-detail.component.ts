import { Component, Input, OnChanges } from '@angular/core';
import {
  INexoImportFile,
  INexoImportLog,
  NexoFileType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { IImportResults, ImportNexoService, IOptionalImportResults } from '../../shared/services/import-nexo.service';

@Component({
  selector: 'app-import-nexo-file-detail',
  templateUrl: './import-nexo-file-detail.component.html',
  styleUrls: ['./import-nexo-file-detail.component.scss']
})
export class ImportNexoFileDetailComponent implements OnChanges {
  @Input() public fileType: NexoFileType;
  @Input() public nexoImportLog: INexoImportLog;
  @Input() public nexoImportFile: INexoImportFile;
  public TaxonomyGroup = TaxonomyGroup;
  public importResults: IImportResults;
  public optionalFileImportResults: IOptionalImportResults;
  public NexoFileType = NexoFileType;

  public isLoading = false;

  constructor(private readonly importNexoService: ImportNexoService) {}

  public ngOnChanges(): void {
    if (this.fileType === NexoFileType.INTERVENTIONS_SE) {
      this.importResults = this.importNexoService.getImportResults(this.nexoImportFile);
    } else {
      this.optionalFileImportResults = this.importNexoService.getOptionalFileImportResults(this.nexoImportFile);
    }
  }

  public async downloadImportFile(): Promise<void> {
    this.isLoading = true;
    await this.importNexoService.downloadNexoFile(this.nexoImportLog.id, this.nexoImportFile.id);
    this.isLoading = false;
  }
}
