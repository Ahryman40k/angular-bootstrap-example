import { HttpClient, HttpEventType, HttpHeaders, HttpProgressEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  DocumentStatus,
  IEnrichedDocument,
  IEnrichedProject,
  IPlainDocument
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { downloadFile } from '../files/utils';
import { IEnrichedDocumentListItem } from '../models/documents/enriched-document-list-item';
import { BroadcastEvent, WindowBroadcastService } from '../window/window-broadcast.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  constructor(private readonly http: HttpClient, private readonly broadcastService: WindowBroadcastService) {}

  public async createInterventionDocument(id: string, document: FormData): Promise<void> {
    await this.createDocument(environment.apis.planning.interventions, id, document);
  }

  public async createProjectDocument(id: string, document: FormData): Promise<void> {
    await this.createDocument(environment.apis.planning.projects, id, document);
  }

  public async createSubmissionDocument(id: string, document: FormData): Promise<void> {
    await this.createDocument(environment.apis.planning.submissionNumber, id, document);
  }

  public async deleteInterventionDocument(interventionId: string, documentId: string): Promise<void> {
    await this.deleteDocument(environment.apis.planning.interventions, interventionId, documentId);
  }

  public async deleteProjectDocument(projectId: string, documentId: string): Promise<void> {
    await this.deleteDocument(environment.apis.planning.projects, projectId, documentId);
  }

  public async deleteSubmissionDocument(submissionNumber: string, documentId: string): Promise<void> {
    await this.deleteDocument(environment.apis.planning.submissionNumber, submissionNumber, documentId);
  }

  public async updateInterventionDocument(
    interventionId: string,
    documentId: string,
    document: FormData
  ): Promise<void> {
    await this.updateDocument(environment.apis.planning.interventions, interventionId, documentId, document);
  }

  public async updateProjectDocument(projectId: string, documentId: string, document: FormData): Promise<void> {
    await this.updateDocument(environment.apis.planning.projects, projectId, documentId, document);
  }

  public async updateSubmissionDocument(
    submissionNumber: string,
    documentId: string,
    document: FormData
  ): Promise<void> {
    await this.updateDocument(environment.apis.planning.submissionNumber, submissionNumber, documentId, document);
  }

  public async downloadInterventionDocument(
    interventionId: string,
    document: IEnrichedDocument,
    progressCallback: (progress: HttpProgressEvent) => void
  ): Promise<void> {
    await this.downloadDocumentFile(
      `${environment.apis.planning.interventions}/${interventionId}`,
      document,
      progressCallback
    );
  }

  public async downloadProjectDocument(
    projectId: string,
    document: IEnrichedDocument,
    progressCallback: (progress: HttpProgressEvent) => void
  ): Promise<void> {
    await this.downloadDocumentFile(`${environment.apis.planning.projects}/${projectId}`, document, progressCallback);
  }

  public async downloadSubmissionDocument(
    submissionNumber: string,
    document: IEnrichedDocument,
    progressCallback: (progress: HttpProgressEvent) => void
  ): Promise<void> {
    await this.downloadDocumentFile(
      `${environment.apis.planning.submissionNumber}/${submissionNumber}`,
      document,
      progressCallback
    );
  }

  private async createDocument(baseUrl: string, entityId: string, document: FormData): Promise<void> {
    await this.http.post<IPlainDocument>(`${baseUrl}/${entityId}/documents`, document).toPromise();
  }

  private async deleteDocument(baseUrl: string, entityId: string, documentId: string): Promise<void> {
    await this.http.delete<IEnrichedDocument>(`${baseUrl}/${entityId}/documents/${documentId}`).toPromise();
  }

  private async updateDocument(
    baseUrl: string,
    entityId: string,
    documentId: string,
    document: FormData
  ): Promise<void> {
    await this.http.put<IPlainDocument>(`${baseUrl}/${entityId}/documents/${documentId}`, document).toPromise();
  }

  private async downloadDocumentFile(
    baseUrl: string,
    document: IEnrichedDocument,
    progressCallback: (progress: HttpProgressEvent) => void
  ): Promise<void> {
    const blob = await new Promise<Blob>((resolve, reject) => {
      this.http
        .get(`${baseUrl}/documents/${document.id}`, {
          responseType: 'blob',
          reportProgress: true,
          observe: 'events'
        })
        .subscribe(event => {
          if (event.type === HttpEventType.DownloadProgress) {
            progressCallback(event);
          }
          if (event.type === HttpEventType.Response) {
            resolve(event.body);
          }
        });
    });
    downloadFile(document.fileName, blob);
  }

  public getProjectDocuments(project: IEnrichedProject): IEnrichedDocumentListItem[] {
    const interventionDocuments: IEnrichedDocument[] = [];
    for (const intervention of project.interventions) {
      if (!intervention.documents?.length) {
        continue;
      }

      const projectTypeDocuments = intervention.documents.filter(d => d.isProjectVisible);
      projectTypeDocuments.forEach((document: IEnrichedDocumentListItem) => {
        document.interventionId = intervention.id;
      });
      interventionDocuments.push(...projectTypeDocuments);
    }
    return [...interventionDocuments, ...(project.documents || [])];
  }

  public createDocumentMenuItemLabelObservable(documents$: Observable<IEnrichedDocument[]>): Observable<string> {
    return documents$.pipe(
      map(documents => {
        if (!documents?.length) {
          return 'Documents';
        }
        const validatedDocuments = documents.filter(d => d.validationStatus === DocumentStatus.validated);
        return `Documents (${validatedDocuments.length}/${documents.length})`;
      })
    );
  }
}
