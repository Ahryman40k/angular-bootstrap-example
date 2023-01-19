import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IEnrichedAnnualProgram,
  IPlainAnnualProgram,
  ITaxonomyList,
  ProgramBookStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { take } from 'rxjs/operators';
import { PROGRAM_BOOK_FIELDS } from 'src/app/shared/models/findOptions/programBookFields';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

@Component({
  selector: 'app-annual-program-share-modal',
  templateUrl: './annual-program-share-modal.component.html',
  styleUrls: ['./annual-program-share-modal.component.scss']
})
export class AnnualProgramShareModalComponent implements OnInit {
  public annualProgram: IEnrichedAnnualProgram;
  public title: string;
  public submitting = false;
  public programBooksStatusesAreValid = false;

  public roles$ = this.taxonomiesService
    .subGroup(TaxonomyGroup.role, TaxonomyGroup.shareableRole, 'annualProgram')
    .pipe(take(1));
  public roles: ITaxonomyList;
  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly annualProgramService: AnnualProgramService,
    private readonly notificationsService: NotificationsService,
    private readonly programBookService: ProgramBookService,
    private readonly taxonomiesService: TaxonomiesService
  ) {
    this.roles$.subscribe(result => (this.roles = result));
  }

  public async ngOnInit() {
    await this.setProgramBooksStatusesAreValid();
  }

  public cancel(): void {
    this.activeModal.close(false);
  }

  private async setProgramBooksStatusesAreValid(): Promise<void> {
    this.programBooksStatusesAreValid = (
      await this.programBookService.getAnnualProgramProgramBooks(this.annualProgram?.id, [PROGRAM_BOOK_FIELDS.STATUS])
    ).every(
      pb => pb.status === ProgramBookStatus.submittedFinal || pb.status === ProgramBookStatus.submittedPreliminary
    );
  }

  public async submit(): Promise<void> {
    try {
      const plainAnnualProgram: IPlainAnnualProgram = {
        budgetCap: this.annualProgram.budgetCap,
        description: this.annualProgram.description,
        executorId: this.annualProgram.executorId,
        sharedRoles: this.roles.map(role => role.code),
        status: this.annualProgram.status,
        year: this.annualProgram.year
      };

      this.submitting = true;
      await this.annualProgramService.update(this.annualProgram.id, plainAnnualProgram);
      this.notificationsService.showSuccess('Le partage de la programmation annuelle a été mis à jour.');
      this.activeModal.close(false);
    } finally {
      this.submitting = false;
    }
  }
}
