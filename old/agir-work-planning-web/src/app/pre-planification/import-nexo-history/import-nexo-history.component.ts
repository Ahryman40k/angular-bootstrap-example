import { Component, HostListener, OnInit } from '@angular/core';
import { INexoImportLog, NexoImportStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BaseComponent } from '../../shared/components/base/base.component';
import { DialogsService } from '../../shared/dialogs/dialogs.service';
import { DEFAULT_NEXO_IMPORT_LOG_LIMIT, ImportNexoService } from '../../shared/services/import-nexo.service';
import { ImportNexoComponent } from '../import-nexo/import-nexo.component';

@Component({
  selector: 'app-import-nexo-history',
  templateUrl: './import-nexo-history.component.html',
  styleUrls: ['./import-nexo-history.component.scss']
})
export class ImportNexoHistoryComponent extends BaseComponent implements OnInit {
  private readonly nexoImportLogsSubject = new BehaviorSubject<INexoImportLog[]>([]);
  public nexoImportLogs$ = this.nexoImportLogsSubject.asObservable();

  private readonly currentOffsetSubject = new BehaviorSubject<number>(0);

  public NexoImportStatus = NexoImportStatus;

  public _selectedImportLog: INexoImportLog;
  public isLoading = false;

  private nexoLogTotalCount: number;

  public get selectedImportLog(): INexoImportLog {
    return this._selectedImportLog;
  }

  public set selectedImportLog(importNexoLog: INexoImportLog) {
    this._selectedImportLog = importNexoLog;
  }

  constructor(private readonly importNexoService: ImportNexoService, private readonly dialogsService: DialogsService) {
    super();
  }

  public ngOnInit(): void {
    this.initImportLogs();
    this.initRefreshImportLogs();
  }

  public selectNexoLog(nexoLog): void {
    if (this.isLoading) {
      return;
    }
    this.selectedImportLog = nexoLog;
  }

  public async import(): Promise<void> {
    const modal = this.dialogsService.showModal(ImportNexoComponent, 'modal-fullscreen');
    modal.componentInstance.title = 'Importer des données NEXO';

    await modal.result;
  }

  @HostListener('scroll', ['$event'])
  public onScroll(event: any): void {
    // visible height + pixel scrolled >= total height
    if (event.target.offsetHeight + event.target.scrollTop >= event.target.scrollHeight && !this.isLoading) {
      this.currentOffsetSubject.next(this.currentOffsetSubject.value + DEFAULT_NEXO_IMPORT_LOG_LIMIT);
    }
  }

  private initRefreshImportLogs(): void {
    this.importNexoService.refreshNexoImportHistorySubject.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.selectedImportLog = null;
      this.nexoLogTotalCount = null;
      this.nexoImportLogsSubject.next([]);
      this.currentOffsetSubject.next(0);
    });
  }

  private initImportLogs(): void {
    this.currentOffsetSubject.pipe(takeUntil(this.destroy$)).subscribe(async offset => {
      if (this.nexoLogTotalCount && this.nexoLogTotalCount <= offset) {
        return;
      }
      const currentNexoImportLogs = this.nexoImportLogsSubject.value;
      this.isLoading = true;
      const newNexoLogs = await this.importNexoService.getNexoImports({ offset });
      this.isLoading = false;
      this.nexoLogTotalCount = newNexoLogs.paging.totalCount;
      this.nexoImportLogsSubject.next([...currentNexoImportLogs, ...newNexoLogs.items]);
      if (!this.selectedImportLog) {
        this.selectedImportLog = this.nexoImportLogsSubject.value[0];
      }
    });
  }
}
