import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IEnrichedProgramBook,
  IPlainProgramBook,
  ITaxonomyList,
  ProgramBookStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { take } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { TaxonomiesService } from '../../shared/services/taxonomies.service';

@Component({
  selector: 'app-program-book-share-final-modal',
  templateUrl: './program-book-share-final-modal.component.html',
  styleUrls: ['./program-book-share-final-modal.component.scss']
})
export class ProgramBookShareFinalModalComponent {
  public programBook: IEnrichedProgramBook;
  public submitting: boolean = false;
  public roles$ = this.taxonomiesService
    .subGroup(TaxonomyGroup.role, TaxonomyGroup.shareableRole, 'programBook')
    .pipe(take(1));
  public roles: ITaxonomyList;

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly notificationsService: NotificationsService,
    private readonly programBookService: ProgramBookService,
    private readonly taxonomiesService: TaxonomiesService
  ) {
    this.roles$.subscribe(result => (this.roles = result));
  }

  public async submit(): Promise<void> {
    try {
      const plainProgramBook: IPlainProgramBook = {
        name: this.programBook.name,
        projectTypes: this.programBook.projectTypes,
        status: ProgramBookStatus.submittedFinal,
        sharedRoles: this.roles.map(role => role.code)
      };
      this.submitting = true;
      await this.programBookService.update(this.programBook.id, plainProgramBook);
      this.notificationsService.showSuccess('La diffusion finale du carnet a été éffectuée avec succès.');
      this.activeModal.close(false);
    } finally {
      this.submitting = false;
    }
  }

  public reject(): void {
    this.activeModal.close(false);
  }
}
