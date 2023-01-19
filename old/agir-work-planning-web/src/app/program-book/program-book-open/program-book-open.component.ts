import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { PriorityScenarioService } from 'src/app/shared/services/priority-scenario.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';

@Component({
  selector: 'app-program-book-open',
  templateUrl: './program-book-open.component.html',
  styleUrls: ['./program-book-open.component.scss']
})
export class ProgramBookOpenComponent extends BaseComponent implements OnInit {
  public programBook: IEnrichedProgramBook;
  public submitting: boolean = false;
  public isPriorityScenarioUnsaved: boolean;

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly notificationsService: NotificationsService,
    private readonly programBookService: ProgramBookService,
    private readonly priorityScenarioService: PriorityScenarioService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.priorityScenarioService.priorityScenarioUnsaved$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isPriorityScenarioUnsaved => {
        this.isPriorityScenarioUnsaved = isPriorityScenarioUnsaved;
      });
  }

  public async submit(): Promise<void> {
    this.submitting = true;
    try {
      await this.programBookService.openProgramBook(this.programBook);
      this.notificationsService.showSuccess('Carnet de programmation ouvert');
      this.activeModal.close(true);
    } finally {
      this.submitting = false;
    }
  }

  public reject(): void {
    this.activeModal.close(false);
  }
}
