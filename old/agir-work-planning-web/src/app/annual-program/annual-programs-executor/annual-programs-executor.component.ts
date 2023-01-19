import { Component, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AnnualProgramExpand,
  IEnrichedAnnualProgram,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { distinct, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import {
  ANNUAL_PROGRAM_FIELDS,
  IAnnualProgramFindOptions
} from 'src/app/shared/models/findOptions/annualProgramFindOptions';
import { IMoreOptionsMenuItem } from 'src/app/shared/models/more-options-menu/more-options-menu-item';
import { IPagination } from 'src/app/shared/models/table/pagination';
import { AnnualProgramMenuService, FromPage } from 'src/app/shared/services/annual-program-menu.service';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

@Component({
  selector: 'app-annual-programs-executor',
  templateUrl: './annual-programs-executor.component.html',
  styleUrls: ['./annual-programs-executor.component.scss']
})
export class AnnualProgramsExecutorComponent extends BaseComponent implements OnInit {
  private readonly INITIAL_PAGE = 1;
  private readonly PAGE_SIZE = 10;
  public menuItems$: Observable<IMoreOptionsMenuItem[]>;
  public annualPrograms: IEnrichedAnnualProgram[];
  public executorId: string;
  public isLoading: boolean = false;
  public emptyListMessage = 'Cet exécutant n’a aucune programmation annuelle associée pour l’instant.';
  public pagination: IPagination = {
    currentPage: this.INITIAL_PAGE,
    limit: this.PAGE_SIZE,
    offset: 0,
    pageSize: this.PAGE_SIZE,
    totalCount: 0
  };
  get executor$(): Observable<ITaxonomy> {
    return this.activatedRoute.params.pipe(
      switchMap(param => this.taxonomiesService.code(TaxonomyGroup.executor, param.code))
    );
  }
  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly annualProgramService: AnnualProgramService,
    private readonly annualProgramMenuService: AnnualProgramMenuService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly router: Router
  ) {
    super();
  }

  public ngOnInit() {
    this.activatedRoute.params.subscribe(param => {
      this.pagination.currentPage = this.INITIAL_PAGE;
      this.pagination.totalCount = 0;
      this.executorId = param.code;
      this.getAnnualPrograms();
    });
  }

  public navigateTo(anp) {
    this.annualProgramService.updateSelectedAnnualProgram(null);
    void this.router.navigateByUrl('/annual-programs/' + anp.id);
  }

  public async onPageChanged(): Promise<void> {
    await this.getAnnualProgramsByExecutorId();
  }

  public getAnnualPrograms(): void {
    this.annualProgramService.annualProgramChanged$
      .pipe(startWith(null), takeUntil(this.destroy$), distinct())
      .subscribe(async data => {
        await this.getAnnualProgramsByExecutorId();
      });
  }

  public async getAnnualProgramsByExecutorId(): Promise<IEnrichedAnnualProgram[]> {
    const searchRequest: IAnnualProgramFindOptions = {
      executorId: this.executorId,
      orderBy: '-year',
      fields: [],
      limit: this.pagination.limit,
      offset: (this.pagination.currentPage - 1) * this.pagination.pageSize
    };
    this.isLoading = true;
    const annualPrograms = await this.annualProgramService.getAnnualProgramsFilterByOptions(searchRequest);
    this.isLoading = false;
    this.annualPrograms = annualPrograms.items;
    this.pagination.totalCount = annualPrograms.paging.totalCount;
    return this.annualPrograms;
  }

  public menuItems(ap): Observable<IMoreOptionsMenuItem[]> {
    return this.annualProgramMenuService.getMenuItems(ap, this.destroy$, FromPage.ANNUAL_PROGRAM_LIST);
  }
}
