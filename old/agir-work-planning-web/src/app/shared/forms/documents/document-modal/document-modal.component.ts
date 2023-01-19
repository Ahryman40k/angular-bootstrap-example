import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  DOCUMENT_EXTENSIONS_ALLOWED,
  DocumentStatus,
  IEnrichedDocument,
  IEnrichedIntervention,
  IEnrichedProject,
  IPlainDocument,
  ISubmission,
  Permission,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { base64Data, readAsDataUrl } from 'src/app/shared/files/utils';
import { IEnrichedDocumentListItem } from 'src/app/shared/models/documents/enriched-document-list-item';
import { ILinkedObject, linkedObjects } from 'src/app/shared/models/interventions/linked-objects';
import { DocumentService } from 'src/app/shared/services/document.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { UserService } from 'src/app/shared/user/user.service';
import { CustomValidators } from 'src/app/shared/validators/custom-validators';

import { isNil } from 'lodash';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { markAllAsTouched } from '../../forms.utils';

const fileMaxSizeMo = 50;

@Component({
  selector: 'app-document-modal',
  templateUrl: './document-modal.component.html',
  styleUrls: ['./document-modal.component.scss']
})
export class DocumentModalComponent extends BaseComponent implements OnInit {
  @Input() public modalTitle: string;
  @Input() public confirmLabel: string;
  @Input() public document: IEnrichedDocumentListItem;
  @Input() public objectType: ObjectType;
  @Input() public objectId: string;
  @Input() public documents: IEnrichedDocument[];

  public linkedObjects: ILinkedObject[] = linkedObjects;
  public isDocumentNameOverridden$: Observable<boolean>;

  public ObjectType = ObjectType;

  public form: FormGroup;
  public documentStatuses$ = this.taxonomiesService.group(TaxonomyGroup.documentStatus).pipe(takeUntil(this.destroy$));
  public documentTypes$ = this.taxonomiesService.group(TaxonomyGroup.documentType).pipe(takeUntil(this.destroy$));

  public submitting = false;
  public notesPopulated = false;

  public get didFileChange(): boolean {
    return !!this.document && !!this.file;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly activeModal: NgbActiveModal,
    private readonly documentService: DocumentService,
    private readonly userService: UserService,
    private readonly taxonomiesService: TaxonomiesService
  ) {
    super();
  }

  public async ngOnInit(): Promise<void> {
    await this.initForm();
    this.initFormSubscriptions();
  }

  public cancel(): void {
    this.activeModal.close(false);
  }

  public initFormSubscriptions(): void {
    this.isDocumentNameOverridden$ = this.form.controls.documentName.valueChanges.pipe(
      map(documentName => {
        return this.documents?.some(d => {
          if (d.documentName.toLowerCase() === this.document?.documentName.toLowerCase()) {
            return false;
          }
          return d.documentName.toLowerCase() === documentName.toLowerCase();
        });
      })
    );
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }
    this.submitting = true;
    await this.createDocument();
  }

  public async populateNotes(): Promise<void> {
    if (this.notesPopulated) {
      return;
    }
    this.notesPopulated = true;

    const user = await this.userService.getCurrentUser();
    const date = new Date().toLocaleString();

    const values = [this.form.controls.notes.value, `${user.name} | ${date}: `];
    this.form.controls.notes.setValue(values.joinStrings('\n', { ignoreTrim: true }));
  }

  private async initForm(): Promise<void> {
    const form = this.fb.group({
      documentName: [null, Validators.required],
      file: [
        null,
        [
          Validators.required,
          CustomValidators.fileMaxSizeMo(fileMaxSizeMo),
          CustomValidators.fileType(...DOCUMENT_EXTENSIONS_ALLOWED)
        ]
      ],
      notes: null
    });

    if (this.objectType === ObjectType.intervention) {
      form.addControl('isProjectVisible', new FormControl(null, Validators.required));
      form.addControl('type', new FormControl(null, Validators.required));
      form.addControl('validationStatus', new FormControl(null, Validators.required));
    }

    this.form = form;

    if (this.document) {
      this.initExistingDocumentForm();
    } else {
      if (this.objectType === ObjectType.intervention) {
        if (await this.userService.hasPermission(Permission.INTERVENTION_DOCUMENT_WRITE)) {
          this.form.controls.validationStatus.setValue(DocumentStatus.validated);
        } else {
          this.form.controls.validationStatus?.setValue(DocumentStatus.pending);
        }
      }
    }
  }

  private initExistingDocumentForm(): void {
    if (this.objectType === ObjectType.intervention) {
      this.form.reset({
        documentName: this.document.documentName,
        isProjectVisible: this.document.isProjectVisible,
        type: this.document.type,
        validationStatus: this.document.validationStatus,
        notes: this.document.notes
      });
    } else if (this.objectType === ObjectType.project) {
      this.form.reset({
        documentName: this.document.documentName,
        isProjectVisible: this.document.isProjectVisible,
        notes: this.document.notes
      });
    } else {
      this.form.reset({
        documentName: this.document.documentName
      });
    }
    this.form.controls.file.setValidators([
      CustomValidators.fileMaxSizeMo(fileMaxSizeMo),
      CustomValidators.fileType(...DOCUMENT_EXTENSIONS_ALLOWED)
    ]);
  }

  private async createDocument(): Promise<void> {
    const document = this.getDocumentFromForm();
    if (this.document) {
      if (this.objectType === ObjectType.submissionNumber) {
        await this.documentService.updateSubmissionDocument(this.objectId, this.document.id, document);
      } else if (this.objectType === ObjectType.intervention) {
        await this.documentService.updateInterventionDocument(this.objectId, this.document.id, document);
      } else {
        await this.documentService.updateProjectDocument(this.objectId, this.document.id, document);
      }
    } else {
      if (this.objectType === ObjectType.submissionNumber) {
        await this.documentService.createSubmissionDocument(this.objectId, document);
      } else if (this.objectType === ObjectType.intervention) {
        await this.documentService.createInterventionDocument(this.objectId, document);
      } else {
        await this.documentService.createProjectDocument(this.objectId, document);
      }
    }
    this.submitting = false;
    this.activeModal.close(true);
  }

  private get file(): File {
    return this.form.controls.file.value instanceof File ? this.form.controls.file.value : null;
  }

  private getDocumentFromForm(): FormData {
    const document = new FormData();
    // set attributes of IPlainDocument
    if (this.file) {
      document.append('file', this.file, this.file.name);
    }
    document.append('documentName', this.form.controls.documentName.value);
    document.append(
      'isProjectVisible',
      this.objectType === ObjectType.intervention ? this.form.value.isProjectVisible : true
    );
    if (!isNil(this.form.controls.notes?.value)) {
      document.append('notes', this.form.controls.notes?.value);
    }
    if (this.objectType === ObjectType.intervention) {
      document.append('type', this.form.controls.type.value);
      document.append('validationStatus', this.form.controls.validationStatus.value);
    }
    return document;
  }
}
