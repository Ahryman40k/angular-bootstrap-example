import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { BaseComponent } from '../../components/base/base.component';

export abstract class ExportModalComponent extends BaseComponent {
  public isExporting = false;
  public isBeforeExporting = true;
  public objectsToExportCount: number;
  public isSuccess = false;
  protected abstract exportedObjectsName: string;

  protected filters: any;
  protected columnProperties: string[];

  constructor(private readonly activeModal: NgbActiveModal) {
    super();
  }

  // tslint:disable-next-line: cyclomatic-complexity
  public initialize(filters: any, columnProperties: string[], objectsToExportCount: number): void {
    this.objectsToExportCount = objectsToExportCount;
    this.filters = filters;
    this.columnProperties = columnProperties;
  }

  public async startExport(): Promise<void> {
    this.isBeforeExporting = false;
    this.isExporting = true;

    this.isSuccess = await this.export();

    this.isExporting = false;
  }

  public quit(): void {
    this.activeModal.close();
  }

  protected abstract export(): Promise<boolean>;
}
