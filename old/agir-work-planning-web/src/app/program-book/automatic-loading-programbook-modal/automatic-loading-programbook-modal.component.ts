import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';
import { interval } from 'rxjs';
import { filter, switchMap, take, takeWhile, tap } from 'rxjs/operators';
import { AlertType } from 'src/app/shared/alerts/alert/alert.component';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { TaxonomyPipe } from 'src/app/shared/pipes/taxonomies.pipe';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';

const INTERVAL_GET_BY_ID = 5000;
enum AutomaticLoadingState {
  Before,
  InProgress,
  Success,
  Error
}
@Component({
  selector: 'app-automatic-loading-programbook-modal',
  templateUrl: './automatic-loading-programbook-modal.component.html',
  providers: [TaxonomyPipe],
  styleUrls: ['./automatic-loading-programbook-modal.component.scss']
})
export class AutomaticLoadingProgrambookModalComponent extends BaseComponent {
  public addedProjectsCount = 0;
  public modalTitle = 'Charger les projets au carnet';
  public loading = false;
  public loadingGetById = false;
  public programBook: IEnrichedProgramBook;
  public AlertType = AlertType;
  public AutomaticLoadingState = AutomaticLoadingState;
  public state: AutomaticLoadingState = AutomaticLoadingState.Before;
  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly taxonomyPipe: TaxonomyPipe,
    private readonly programBookService: ProgramBookService
  ) {
    super();
  }

  public submit(): void {
    this.state = AutomaticLoadingState.InProgress;
    this.programBookService
      .executeProgrambookAutomaticLoading(this.programBook.id)
      .pipe(take(1))
      .subscribe(
        () => {
          this.refreshIsAutomaticLoadingInProgress();
        },
        (err: HttpErrorResponse) => {
          if (err.status === 202) {
            this.refreshIsAutomaticLoadingInProgress();
            return;
          }
          this.state = AutomaticLoadingState.Error;
        }
      );
  }

  public close() {
    this.activeModal.close();
  }

  private refreshIsAutomaticLoadingInProgress() {
    interval(INTERVAL_GET_BY_ID)
      .pipe(
        filter(() => !this.loadingGetById),
        tap(() => (this.loadingGetById = true)),
        switchMap(() => this.programBookService.getProgramBookById(this.programBook.id)),
        tap(pb => {
          this.programBook.isAutomaticLoadingInProgress = pb.isAutomaticLoadingInProgress;
          this.loadingGetById = false;
          if (!this.programBook.isAutomaticLoadingInProgress) {
            this.addedProjectsCount =
              (pb?.priorityScenarios?.find(x => x)?.orderedProjects.paging.totalCount || 0) -
              (this.programBook?.priorityScenarios?.find(x => x)?.orderedProjects.paging.totalCount || 0);
            this.state = AutomaticLoadingState.Success;
            if (this.addedProjectsCount > 0) {
              this.programBookService.programBookChangedSubject.next();
            }
          }
        }),
        takeWhile(() => this.programBook.isAutomaticLoadingInProgress)
      )
      .subscribe(undefined, () => (this.state = AutomaticLoadingState.Error));
  }

  public get projectTypes(): string {
    return this.programBook.projectTypes
      ?.map(el => this.taxonomyPipe.transform(el, this.TaxonomyGroup.projectType))
      .join(', ');
  }
  public get programTypes(): string {
    return this.programBook.programTypes
      ?.map(el => this.taxonomyPipe.transform(el, this.TaxonomyGroup.programType))
      .join(', ');
  }
  public get boroughIds(): string {
    return this.programBook.boroughIds
      ?.map(el => this.taxonomyPipe.transform(el, this.TaxonomyGroup.borough))
      .join(', ');
  }
}
