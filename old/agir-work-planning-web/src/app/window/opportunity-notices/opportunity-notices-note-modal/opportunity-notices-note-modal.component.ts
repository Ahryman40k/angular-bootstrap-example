import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IEnrichedNote, IEnrichedOpportunityNotice, IPlainNote } from '@villemontreal/agir-work-planning-lib/dist/src';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { markAllAsTouched } from 'src/app/shared/forms/forms.utils';
import { OpportunityNoticeService } from 'src/app/shared/services/opportunity-notice.service';

@Component({
  selector: 'app-opportunity-notice-note-modal',
  templateUrl: './opportunity-notices-note-modal.component.html'
})
export class OpportunityNoticeNoteModalComponent extends BaseComponent implements OnInit {
  public modalTitle: string;
  public confirmationButtonLabel: string;
  public form: FormGroup;
  public submitting = false;
  private opportunityNotice: IEnrichedOpportunityNotice;
  private opportunityNoticeNote: IEnrichedNote;

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder,
    private readonly opportunityNoticeService: OpportunityNoticeService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.initModalInfo();
    this.initForm();
  }

  private initModalInfo(): void {
    this.modalTitle = this.opportunityNoticeNote ? "Modifier la note de l'avis" : "Ajouter une note à l'avis";
    this.confirmationButtonLabel = this.opportunityNoticeNote ? 'Modifier' : 'Ajouter';
  }

  private initForm(): void {
    this.form = this.fb.group({
      note: [this.opportunityNoticeNote?.text, [Validators.required]]
    });
  }

  public init(opportunityNotice: IEnrichedOpportunityNotice, opportunityNoticeNote: IEnrichedNote): void {
    this.opportunityNotice = opportunityNotice;
    this.opportunityNoticeNote = opportunityNoticeNote;
  }

  public cancel(): void {
    this.form.reset();
    this.activeModal.close();
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }
    try {
      this.submitting = true;
      const result = this.opportunityNoticeNote
        ? await this.opportunityNoticeService.updateOpportunityNoticeNote(
            this.opportunityNotice.id,
            this.opportunityNoticeNote?.id,
            this.getPlainNote()
          )
        : await this.opportunityNoticeService.addNoteToOpportunityNotice(
            this.opportunityNotice.id,
            this.getPlainNote()
          );

      this.activeModal.close(result);
    } finally {
      this.submitting = false;
    }
  }

  private getPlainNote(): IPlainNote {
    return {
      text: this.form.value.note
    };
  }
}
