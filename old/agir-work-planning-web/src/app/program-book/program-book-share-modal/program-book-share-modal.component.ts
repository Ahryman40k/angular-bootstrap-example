import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IEnrichedProgramBook, IPlainProgramBook, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib';
import { take, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { PriorityScenarioService } from 'src/app/shared/services/priority-scenario.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

export enum MODAL_TEXT {
  SHARE_MODAL_TITLE = 'Diffuser le carnet de programmation',
  CANCEL_BTN = 'Annuler',
  SHARE_BTN = 'Diffuser',
  WARNING_TITLE = 'Attention!',
  WARNING_TEXT = "Cette modification entrainera la perte des données non-sauvegardées de l'ordonnancement. Êtes-vous certain de vouloir continuer?"
}
@Component({
  selector: 'app-program-book-share-modal',
  templateUrl: './program-book-share-modal.component.html',
  styleUrls: ['./program-book-share-modal.component.scss']
})
export class ProgramBookShareModalComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public programBook: IEnrichedProgramBook;
  public submitting = false;
  public isPriorityScenarioUnsaved: boolean;

  public MODAL_TEXT = MODAL_TEXT;

  public roles$ = this.taxonomiesService
    .subGroup(TaxonomyGroup.role, TaxonomyGroup.shareableRole, 'programBook')
    .pipe(take(1));

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder,
    private readonly notificationsService: NotificationsService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly programBookService: ProgramBookService,
    private readonly priorityScenarioService: PriorityScenarioService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.form = this.createForm();

    this.priorityScenarioService.priorityScenarioUnsaved$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isPriorityScenarioUnsaved => {
        this.isPriorityScenarioUnsaved = isPriorityScenarioUnsaved;
      });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      roles: [this.programBook.sharedRoles, [Validators.required]]
    });
  }

  public cancel(): void {
    this.form.reset();
    this.activeModal.close(false);
  }

  public async submit(): Promise<void> {
    try {
      const plainProgramBook: IPlainProgramBook = {
        name: this.programBook.name,
        projectTypes: this.programBook.projectTypes,
        status: this.programBook.status,
        sharedRoles: this.form.controls.roles.value
      };

      this.submitting = true;
      this.form.disable();

      await this.programBookService.update(this.programBook.id, plainProgramBook);

      this.notificationsService.showSuccess('Le partage du carnet a été mis à jour.');

      this.activeModal.close(false);
    } finally {
      this.submitting = false;
      this.form.enable();
    }
  }
}
