import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AnnualProgramExpand,
  IEnrichedObjective,
  IEnrichedProgramBook
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { sumBy } from 'lodash';
import { combineLatest } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { ProgramBookModalComponent } from 'src/app/program-book/program-book-modal/program-book-modal.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { ANNUAL_PROGRAM_FIELDS } from 'src/app/shared/models/findOptions/annualProgramFindOptions';
import { PROJECT_FIELDS } from 'src/app/shared/models/findOptions/projectFields';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { SubmissionProjectService } from 'src/app/shared/services/submission-project.service';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';
import { UserService } from 'src/app/shared/user/user.service';
import { BaseAnnualProgramProgram } from '../base-annual-program';
interface IProgramBookBlock {
  programBook: IEnrichedProgramBook;
  projectCount: number;
  interventionCount: number;
  validSubmissionCount: number;
}
@Component({
  selector: 'app-annual-program-details-programbooks',
  templateUrl: './annual-program-details-programbooks.component.html',
  styleUrls: ['./annual-program-details-programbooks.component.scss']
})
export class AnnualProgramDetailsProgrambooksComponent extends BaseAnnualProgramProgram implements OnInit {
  public programBooks: IEnrichedProgramBook[];
  public objectives: IEnrichedObjective[];
  public programBookBlocks: IProgramBookBlock[] = [];
  public emptyListMessage = 'Cette programmation n’a aucun carnet associé pour l’instant.';
  public isLoading: boolean = false;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly programBookService: ProgramBookService,
    public readonly annualProgramService: AnnualProgramService,
    public readonly userService: UserService,
    public readonly projectService: ProjectService,
    public readonly submissionService: SubmissionProjectService,
    private readonly dialogsService: DialogsService
  ) {
    super(annualProgramService, userService, projectService, submissionService);
  }

  public get canInteract(): boolean {
    return this.annualProgramService.canInteract(this.currentAnnualProgram);
  }
  public ngOnInit() {
    combineLatest(this.activatedRoute.parent.params, this.programBookService.programBookChanged$.pipe(startWith(null)))
      .pipe(takeUntil(this.destroy$))
      .subscribe(async ([param, programbook]) => {
        this.isLoading = true;
        this.currentAnnualProgram = await this.annualProgramService.getOne(
          param.id,
          [
            ANNUAL_PROGRAM_FIELDS.STATUS,
            ANNUAL_PROGRAM_FIELDS.YEAR,
            ANNUAL_PROGRAM_FIELDS.EXECUTOR_ID,
            ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_STATUS,
            ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_ID,
            ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_OBJECTIVES,
            ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_NAME
          ],
          [AnnualProgramExpand.programBooks]
        );
        this.annualProgramService.updateSelectedAnnualProgram(this.currentAnnualProgram);
        this.programBooks = this.currentAnnualProgram.programBooks;
        this.programBooksIds = this.programBooks.map(programBook => programBook.id);
        if (this.programBooksIds.length > 0) {
          const programBookProjects = await this.getProjects(this.programBooksIds, [
            PROJECT_FIELDS.INTERVENTION_IDS,
            PROJECT_FIELDS.ANNUALDISTRIBUTION_ANNUALPERIODS_PROGRAMBOOKID
          ]);
          this.getSubmissionsCountBy(this.programBooksIds, 'programBookId', 'valid').subscribe(data => {
            const submissionCountResult = data;
            this.programBookBlocks = [];
            this.programBooks.map(programBook => {
              const projects = programBookProjects.filter(e =>
                e.annualDistribution.annualPeriods.find(a => a.programBookId === programBook.id)
              );
              const submissionCount = submissionCountResult.find(e => e.id === programBook.id);
              this.programBookBlocks.push({
                programBook,
                projectCount: projects.length,
                interventionCount: sumBy(projects, 'interventionIds.length'),
                validSubmissionCount: submissionCount ? submissionCount.count : 0
              });
              this.isLoading = false;
            });
          });
        } else {
          this.isLoading = false;
        }
      });
  }

  public async createProgramBook(): Promise<void> {
    const modal = this.dialogsService.showModal(ProgramBookModalComponent);
    modal.componentInstance.annualProgram = this.currentAnnualProgram;
    modal.componentInstance.title = 'Ajouter un carnet de programmation';
    modal.componentInstance.buttonLabel = 'Ajouter';

    await modal.result;
  }

  public get restrictionItems(): IRestrictionItem[] {
    return [{ entity: this.currentAnnualProgram, entityType: 'ANNUAL_PROGRAM' }];
  }
}
