import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  INexoImportFile,
  INexoImportLog,
  ModificationType,
  NexoFileType,
  NexoImportStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { saveAs } from 'file-saver';
import { BehaviorSubject, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { downloadCsvFile } from '../files/utils';
import { buildHttpParams } from '../http/params-builder';
import { IPaginatedQuery } from '../models/paginated-query';
import { IPaginatedResults } from '../models/paginated-results';
import { Utils } from '../utils/utils';
import { BaseUploadDownloadService } from './base-upload-download.service';
import { TaxonomiesService } from './taxonomies.service';

export const DEFAULT_NEXO_IMPORT_LOG_LIMIT = 10;

export enum startImportResponse {
  ACCEPTED = 'Accepted',
  REFUSED = 'Refused'
}
export interface IImportResults {
  interventionsToImport: number;
  createdInterventions: number;
  updatedInterventions: number;
  canceledInterventions: number;
  errorInterventions: number;
}
export interface IOptionalImportResults {
  interventionsToImport: number;
  updatedInterventions: number;
  errorInterventions: number;
}
interface INexoImportSearchObject extends IPaginatedQuery {
  status?: NexoImportStatus;
}
@Injectable({
  providedIn: 'root'
})
export class ImportNexoService extends BaseUploadDownloadService<INexoImportLog> {
  public importResultsSubject = new BehaviorSubject<File>(null);

  public lastDownloadedFile: {
    data: any;
    fileId: string;
  };

  public refreshNexoImportHistorySubject = new Subject();

  constructor(http: HttpClient, public datePipe: DatePipe, private readonly taxonomiesService: TaxonomiesService) {
    super(http, `${environment.apis.planning.nexoImports}/file`);
  }

  public async startImport(id: string): Promise<string> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'text/plain; charset=utf-8'
      }),
      responseType: 'text' as 'text'
    };
    return this.http.post(`${environment.apis.planning.nexoImports}/${id}/import`, null, options).toPromise();
  }

  public async getNexoImport(id: string): Promise<INexoImportLog> {
    return this.http.get<INexoImportLog>(`${environment.apis.planning.nexoImports}/${id}`).toPromise();
  }

  public async getNexoImports(searchObj?: INexoImportSearchObject): Promise<IPaginatedResults<INexoImportLog>> {
    const defaultSearchObj: INexoImportSearchObject = {
      limit: DEFAULT_NEXO_IMPORT_LOG_LIMIT,
      offset: 0
    };
    if (searchObj && !searchObj.limit) {
      searchObj.limit = DEFAULT_NEXO_IMPORT_LOG_LIMIT;
    }
    const httpParams = searchObj ? buildHttpParams(searchObj) : buildHttpParams(defaultSearchObj);
    return this.http
      .get<IPaginatedResults<INexoImportLog>>(`${environment.apis.planning.nexoImports}?orderBy=-createdAt`, {
        params: httpParams
      })
      .toPromise();
  }

  public async uploadNexoFile(file: File, headers?: { [key: string]: string }): Promise<INexoImportLog> {
    const body = await this.getBodyForUpload(file, NexoFileType.INTERVENTIONS_SE);
    return super.uploadFile(body, headers);
  }

  public async uploadSecondaryFile(
    file: File,
    id: string,
    nexoFileType: NexoFileType,
    headers?: { [key: string]: string }
  ): Promise<INexoImportLog> {
    const body = await this.getBodyForUpload(file, nexoFileType);
    return this.uploadOptionalFile(body, id, headers);
  }

  public uploadOptionalFile(
    body: { [key: string]: string | Blob },
    firstFileId,
    headers?: { [key: string]: string }
  ): Promise<INexoImportLog> {
    const newHeaders = Object.assign({ Accept: 'application/json' }, headers);
    const input = new FormData();
    const url = `${environment.apis.planning.nexoImports}/${firstFileId}/file`;
    for (const [key, value] of Object.entries(body)) {
      input.append(key, value);
    }
    return this.http
      .put<INexoImportLog>(url, input, { headers: newHeaders })
      .toPromise();
  }

  public async downloadNexoImportResults(nexoImportLog: INexoImportLog): Promise<void> {
    if (!this.importResultsSubject.value) {
      const fileName = this.generateFileName(nexoImportLog);
      const importResults = await this.generateImportResultsDataToCsv(nexoImportLog);
      const file = downloadCsvFile(importResults, fileName);
      this.importResultsSubject.next(file);
    } else {
      saveAs(this.importResultsSubject.value);
    }
  }

  public async downloadNexoFile(nexoLogId: string, nexoFileId: string): Promise<void> {
    let multiPartData: any;
    if (this.lastDownloadedFile?.fileId === nexoFileId && this.lastDownloadedFile?.data) {
      multiPartData = this.lastDownloadedFile.data;
    } else {
      multiPartData = await this.http
        .get<any>(`${environment.apis.planning.nexoImports}/${nexoLogId}/file/${nexoFileId}`)
        .toPromise();
      this.lastDownloadedFile = {
        data: multiPartData,
        fileId: nexoFileId
      };
    }
    Utils.createAndDownloadBlobFile(multiPartData);
  }

  public getImportResults(nexoImportFile: INexoImportFile): IImportResults {
    return {
      interventionsToImport: nexoImportFile.numberOfItems,
      createdInterventions: this.getNumberOfInterventions(
        nexoImportFile,
        NexoImportStatus.SUCCESS,
        ModificationType.CREATION
      ),
      updatedInterventions: this.getNumberOfInterventions(
        nexoImportFile,
        NexoImportStatus.SUCCESS,
        ModificationType.MODIFICATION
      ),
      canceledInterventions: this.getNumberOfInterventions(
        nexoImportFile,
        NexoImportStatus.SUCCESS,
        ModificationType.DELETION
      ),
      errorInterventions: this.getNumberOfInterventions(nexoImportFile, NexoImportStatus.FAILURE, null)
    };
  }
  public getOptionalFileImportResults(nexoImportFile: INexoImportFile): IOptionalImportResults {
    return {
      interventionsToImport: nexoImportFile.numberOfItems,
      updatedInterventions: this.getNumberOfInterventions(nexoImportFile, NexoImportStatus.SUCCESS, null),
      errorInterventions: this.getNumberOfInterventions(nexoImportFile, NexoImportStatus.FAILURE, null)
    };
  }
  private async getBodyForUpload(
    file,
    fileType: NexoFileType
  ): Promise<{ file: File; fileContentType: string; filename: string; fileType: NexoFileType }> {
    return {
      file,
      filename: file.name,
      fileContentType: file.type,
      fileType
    };
  }

  private generateFileName(nexoImportLog: INexoImportLog): string {
    const dateTimeString = this.datePipe.transform(nexoImportLog.audit.createdAt, 'y-MM-dd_hh-mm-ss');
    return `NexoImport_results_${dateTimeString}.csv`;
  }

  private async generateImportResultsDataToCsv(nexoImportLog: INexoImportLog): Promise<string[]> {
    const importResultsDataToCsv: string[] = [];
    for (const file of nexoImportLog.files) {
      if (file.type === NexoFileType.INTERVENTIONS_SE) {
        const importResults: IImportResults = this.getImportResults(file);
        const importSummary = await this.getImportResultsSummary(file, importResults);
        importResultsDataToCsv.push(...importSummary);
      } else {
        const importBudgetResults: IOptionalImportResults = this.getOptionalFileImportResults(file);
        const importSummary = await this.getOptionalImportResultsSummary(file, importBudgetResults);
        importResultsDataToCsv.push(...importSummary);
      }

      importResultsDataToCsv.push(...this.getImportResultsErrors(file));
      importResultsDataToCsv.push(...['', '', '']);
    }
    return importResultsDataToCsv;
  }

  private getNumberOfInterventions(
    nexoImportFile: INexoImportFile,
    importStatus: NexoImportStatus,
    modificationType: ModificationType
  ): number {
    return (
      nexoImportFile.interventions.filter(
        i => i.importStatus === importStatus && (!modificationType || i.modificationType === modificationType)
      )?.length || 0
    );
  }
  private async getOptionalImportResultsSummary(
    file: INexoImportFile,
    result: IOptionalImportResults
  ): Promise<string[]> {
    const fileTypeLabel = await this.getFileTypeLabel(file);
    const nexoImportStatus = await this.getNexoImportStatus(file);
    return [
      `Fichier - ${fileTypeLabel} : ${file.name}`,
      `${nexoImportStatus}`,
      `Nombre d'interventions à importer;${result.interventionsToImport || 0}`,
      `Nombre d'interventions mises à jour;${result.updatedInterventions || 0}`,
      `Nombre d'interventions en erreurs;${result.errorInterventions || 0}`
    ];
  }
  private async getImportResultsSummary(file: INexoImportFile, result: IImportResults): Promise<string[]> {
    const fileTypeLabel = await this.getFileTypeLabel(file);
    const nexoImportStatus = await this.getNexoImportStatus(file);
    return [
      `Fichier - ${fileTypeLabel} : ${file.name}`,
      `${nexoImportStatus}`,
      `Nombre d'interventions à importer;${result.interventionsToImport || 0}`,
      `Nombre d'interventions créées;${result.createdInterventions || 0}`,
      `Nombre d'interventions mises à jour;${result.updatedInterventions || 0}`,
      `Nombre d'interventions supprimées;${result.canceledInterventions || 0}`,
      `Nombre d'interventions en erreurs;${result.errorInterventions || 0}`
    ];
  }
  private async getFileTypeLabel(file): Promise<string> {
    return (
      await this.taxonomiesService
        .code(TaxonomyGroup.nexoFileType, file.type)
        .pipe(take(1))
        .toPromise()
    )?.label.fr;
  }
  private async getNexoImportStatus(file): Promise<string> {
    let nexoImportStatus = (
      await this.taxonomiesService
        .code(TaxonomyGroup.nexoImportStatus, file.status)
        .pipe(take(1))
        .toPromise()
    )?.label.fr;

    if (file.status === NexoImportStatus.FAILURE && file.errorDescription !== '') {
      nexoImportStatus = nexoImportStatus.concat(` - ${file.errorDescription}`);
    }
    return nexoImportStatus;
  }
  private getImportResultsErrors(file: INexoImportFile): string[] {
    if (file.status !== NexoImportStatus.FAILURE) {
      return [];
    }

    const errors = [];
    file.interventions.forEach(intervention => {
      if (intervention.importStatus === NexoImportStatus.SUCCESS) {
        return;
      }
      errors.push(`${intervention.lineNumber};${intervention.id};${intervention.description}`);
    });
    if (errors.length) {
      errors.unshift(...['', 'Ligne;Intervention;Description']);
    }
    return errors;
  }
}
