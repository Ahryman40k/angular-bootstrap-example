import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  IBicImportLog,
  IDiagnosticsInfo,
  IPaginatedBicImportLogs
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { DiagnosticService } from 'src/app/shared/services/diagnostic.service';
import { ImportInternalService } from 'src/app/shared/services/import-internal.service';
import { BaseComponent } from '../../../../shared/components/base/base.component';

const version = require('../../../../../../package.json').version;

@Component({
  selector: 'app-map-legend-info',
  templateUrl: './map-legend-info.component.html'
})
export class MapLegendInfoComponent extends BaseComponent implements OnInit {
  public bicImports$: Observable<IPaginatedBicImportLogs>;
  public bicImport: IBicImportLog;
  public diagnostic$: Observable<IDiagnosticsInfo>;
  public diagnostic: IDiagnosticsInfo;
  public versionUI: string = version;

  constructor(
    private readonly importService: ImportInternalService,
    private readonly diagnosticService: DiagnosticService
  ) {
    super();
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.initBicImport();
    this.initDiagnosticInfo();
  }

  private initBicImport(): void {
    this.importService
      .getBicImports()
      .pipe(takeUntil(this.destroy$))
      .subscribe(imports => {
        if (!isEmpty(imports.items)) {
          this.bicImport = imports.items[0];
        }
      });
  }

  private initDiagnosticInfo(): void {
    this.diagnosticService
      .getInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => {
        this.diagnostic = info;
      });
  }
}
