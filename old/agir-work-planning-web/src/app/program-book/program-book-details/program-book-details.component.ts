import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IEnrichedAnnualProgram,
  IEnrichedProgramBook,
  Permission,
  ProgramBookExpand
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { IMoreOptionsMenuItem } from 'src/app/shared/models/more-options-menu/more-options-menu-item';
import { MapService } from 'src/app/shared/services/map.service';
import { PriorityScenarioService } from 'src/app/shared/services/priority-scenario.service';
import { ProgramBookMenuService } from 'src/app/shared/services/program-book-menu.service';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';

import { ProjectService } from '../../shared/services/project.service';

interface INavItem {
  url: string;
  label: string;
  permission?: Permission;
}

@Component({
  selector: 'app-program-book-details',
  templateUrl: './program-book-details.component.html',
  styleUrls: ['./program-book-details.component.scss']
})
export class ProgramBookDetailsComponent extends BaseComponent implements OnInit {
  @ViewChild('programBookNavOptions') public programBookNavOptions: ElementRef;

  public programBook: IEnrichedProgramBook;
  public annualProgram: IEnrichedAnnualProgram;

  public programBook$: Observable<IEnrichedProgramBook>;
  public programBooksControl = new FormControl();
  public annualProgramProgramBooks: IEnrichedProgramBook[];
  protected navItems: INavItem[] = [
    {
      label: 'Sommaire',
      url: 'summary'
    },
    {
      label: 'Objectifs',
      url: 'objectives',
      permission: Permission.PROGRAM_BOOK_OBJECTIVE_READ
    },
    {
      label: 'Ordonnancement',
      url: 'sequencing',
      permission: Permission.PROGRAM_BOOK_PRIORITY_SCENARIOS_READ
    },
    {
      label: 'Projets programmés',
      url: 'programmed'
    },
    {
      label: 'Projets retirés',
      url: 'removed'
    },
    {
      label: 'Gestion des DRM',
      url: 'drm',
      permission: Permission.PROJECT_DRM_WRITE
    },
    {
      label: 'Gestion des soumissions',
      url: 'submission',
      permission: Permission.SUBMISSION_WRITE
    },
    {
      label: 'Soumissions',
      url: 'submission-list',
      permission: Permission.PROGRAM_BOOK_SUBMISSIONS_READ
    }
  ];

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly programBookMenuService: ProgramBookMenuService,
    private readonly programBookService: ProgramBookService,
    private readonly mapService: MapService,
    private readonly router: Router,
    private readonly projectService: ProjectService,
    private readonly priorityScenarioService: PriorityScenarioService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.initProgramBookAndAnnualProgram();
    this.initProgramBooksControl();
    this.initPriorityScenarioChanges();
  }

  private initPriorityScenarioChanges(): void {
    this.priorityScenarioService.priorityScenarioPageReturned$.subscribe(() => {
      this.programBooksControl.setValue(this.programBook.id);
      for (const navItem of this.programBookNavOptions.nativeElement.children) {
        navItem.firstChild.blur();
      }
    });
  }

  private initProgramBookAndAnnualProgram(): void {
    const routeId$ = this.activatedRoute.params.pipe(
      filter(p => p.id),
      map(p => p.id as string)
    );
    const id$ = combineLatest(routeId$, this.programBookService.programBookChanged$.pipe(startWith(null))).pipe(
      takeUntil(this.destroy$),
      map(([id]) => id)
    );

    this.programBook$ = combineLatest(
      id$,
      this.projectService.projectChanged$.pipe(startWith(null)),
      this.priorityScenarioService.priorityScenarioChanged$.pipe(startWith(null))
    ).pipe(
      takeUntil(this.destroy$),
      switchMap(([id]) => this.programBookService.getProgramBookById(id, [ProgramBookExpand.annualProgram])),
      shareReplay()
    );

    this.programBook$.subscribe(async pb => {
      this.programBookService.setSelectedProgramBooksDetails(pb);
      this.programBook = pb;
      this.setAnnualProgramProgramBooks();
      this.annualProgram = this.programBook.annualProgram;
      this.annualProgramProgramBooks = await this.programBookService.getAnnualProgramProgramBooks(
        this.annualProgram.id,
        ['name', 'projectTypes', 'status', 'boroughIds', 'programTypes', 'sharedRoles', 'inCharge', 'description']
      );
    });
  }

  private initProgramBooksControl(): void {
    this.programBooksControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((prev, current) => prev === current)
      )
      .subscribe(programBookId => {
        this.programBookService.programBookSelected();
        if (!programBookId) {
          return;
        }
        void this.router.navigate([
          '/program-books/',
          programBookId,
          this.activatedRoute.snapshot.firstChild.url[0].path
        ]);
      });
  }

  private setAnnualProgramProgramBooks(): void {
    this.programBooksControl.setValue(this.programBook.id);
  }

  public getProgramBookMenuItems(): IMoreOptionsMenuItem[] {
    return this.programBookMenuService.getMenuItems(this.programBook, this.annualProgram);
  }

  public get isAutomaticLoadingInProgress(): boolean {
    return this.programBookService.isAutomaticLoadingInProgress;
  }

  public viewMap(): void {
    this.mapService.viewMap({
      queryParams: { 'program-book': this.programBook.id, 'annual-program-id': this.annualProgram.id }
    });
  }
}
