import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AnnualProgramConstant,
  AnnualProgramExpand,
  ISubmission,
  ProgramBookExpand
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { max } from 'lodash';
import { forkJoin, of } from 'rxjs';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';

import { MapLogicLayer } from '../map/config/layers/logic-layers/map-logic-layer-enum';
import { MapLayers } from '../map/config/layers/map-enums';
import { filterByKeyValue } from '../map/config/layers/utils';
import { arrayOfNumbers } from '../shared/arrays/number-arrays';
import { BaseComponent } from '../shared/components/base/base.component';
import { GlobalFilterShownElement } from '../shared/models/filters/global-filter-shown-element';
import { ObjectType } from '../shared/models/object-type/object-type';
import { AnnualProgramService } from '../shared/services/annual-program.service';
import { GlobalFilterService } from '../shared/services/filters/global-filter.service';
import { GlobalLayerService } from '../shared/services/global-layer.service';
import { InterventionService } from '../shared/services/intervention.service';
import { MapNavigationService, MapOutlet } from '../shared/services/map-navigation.service';
import { MapService } from '../shared/services/map.service';
import { ProgramBookService } from '../shared/services/program-book.service';
import { ProjectService } from '../shared/services/project.service';
import { RouteService } from '../shared/services/route.service';
import { RtuProjectService } from '../shared/services/rtu-project.service';
import { SearchObjectsService } from '../shared/services/search-objects.service';
import { SubmissionProjectService } from '../shared/services/submission-project.service';
import { Utils } from '../shared/utils/utils';

const MIN_YEAR_SEARCH = 2000;

interface IPlanningBookComponentFormValue {
  pastProjectsVisible: boolean;
  presentProjectsVisible: boolean;
  futureProjectsVisible: boolean;
  pastYear: string;
  endYear: string;
  yearSelect: string;
}
enum TypeFilter {
  pastProjectsVisible = 'pastProjectsVisible',
  presentProjectsVisible = 'presentProjectsVisible',
  futureProjectsVisible = 'futureProjectsVisible'
}
@Component({
  selector: 'app-planning-book',
  templateUrl: './planning-book.component.html',
  styleUrls: ['./planning-book.component.scss']
})
export class PlanningBookComponent extends BaseComponent implements OnInit {
  public ObjectType = ObjectType;
  public yearList: number[];
  public percentage = 0; // Will change when we'll have the real objective percentage
  public yearsForm: FormGroup;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly projectService: ProjectService,
    private readonly rtuPojectService: RtuProjectService,
    private readonly interventionService: InterventionService,
    private readonly mapNavigationService: MapNavigationService,
    private readonly mapService: MapService,
    private readonly route: ActivatedRoute,
    private readonly searchObjectsService: SearchObjectsService,
    private readonly routeService: RouteService,
    public readonly annualProgramService: AnnualProgramService,
    private readonly submissionProjectService: SubmissionProjectService,
    private readonly programBookService: ProgramBookService,
    public globalFilterService: GlobalFilterService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.initYearsForm();
    this.mapService.mapLoaded$.pipe(takeUntil(this.destroy$)).subscribe(() => this.initMap());
    this.initYearFilter();
    this.initAnnualProgramFilters();
    this.initSubmissionFilters();
  }

  private initYearsForm(): void {
    this.yearList = arrayOfNumbers(AnnualProgramConstant.minimumYear, AnnualProgramConstant.maximumYear);
    this.yearsForm = this.formBuilder.group({
      pastProjectsVisible: [false],
      presentProjectsVisible: [true],
      futureProjectsVisible: [true],
      pastYear: [null],
      endYear: [2],
      yearSelect: [this.projectService.fromYear],
      planningBookSelect: [[]]
    });
    this.initYearsFormSubscriptions();
  }

  private initYearsFormSubscriptions(): void {
    let typeFilter: TypeFilter;
    this.yearsForm.controls.pastProjectsVisible.valueChanges.subscribe(async value => {
      typeFilter = TypeFilter.pastProjectsVisible;
      await this.mapService.setLayerVisibility(
        [
          MapLogicLayer.pastProjectAreas,
          MapLogicLayer.pastProjectPins,
          MapLogicLayer.pastRtuProjectAreas,
          MapLogicLayer.pastRtuProjectPins
        ],
        value
      );
      value ? this.yearsForm.controls.pastYear.enable() : this.yearsForm.controls.pastYear.disable();
    });
    this.yearsForm.controls.presentProjectsVisible.valueChanges.subscribe(async value => {
      typeFilter = TypeFilter.presentProjectsVisible;
      await this.mapService.setLayerVisibility(
        [
          MapLogicLayer.presentProjectAreas,
          MapLogicLayer.presentProjectPins,
          MapLogicLayer.presentRtuProjectAreas,
          MapLogicLayer.presentRtuProjectPins
        ],
        value
      );
    });
    this.yearsForm.controls.futureProjectsVisible.valueChanges.subscribe(async value => {
      typeFilter = TypeFilter.futureProjectsVisible;
      await this.mapService.setLayerVisibility(
        [
          MapLogicLayer.futureProjectAreas,
          MapLogicLayer.futureProjectPins,
          MapLogicLayer.futureRtuProjectAreas,
          MapLogicLayer.futureRtuProjectPins
        ],
        value
      );
      value ? this.yearsForm.controls.endYear.enable() : this.yearsForm.controls.endYear.disable();
    });

    this.yearsForm.controls.yearSelect.valueChanges.subscribe(value => {
      this.projectService.fromYear = +value;
      this.mapService.setMapLayerFilter(
        MapLayers.MOBILITY_AXIS,
        filterByKeyValue('annee', this.projectService.fromYear + '')
      );
    });

    this.yearsForm.valueChanges.subscribe(v => this.onFormValueChanges(v, typeFilter));
  }

  private initSubmissionFilters(): void {
    this.annualProgramService.clearCachedPaginatedAnnualPrograms();
    this.route.queryParams
      .pipe(
        filter(params => params['submission-number']),
        map(params => params['submission-number'] as string),
        switchMap((id: string) => this.submissionProjectService.getSubmissionById(id)),
        switchMap((submission: ISubmission) => {
          return forkJoin([
            this.programBookService.getProgramBookById(submission.programBookId, [ProgramBookExpand.annualProgram]),
            of(submission)
          ]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(([pb, submission]) => {
        this.resetFilters(pb?.annualProgram?.year);
        this.globalFilterService.patch({
          submissionNumber: [submission.submissionNumber]
        });
      });
  }

  public initAnnualProgramFilters(): void {
    this.annualProgramService.clearCachedPaginatedAnnualPrograms();
    this.route.queryParams
      .pipe(
        filter(params => params['annual-program-id']),
        switchMap((params: Params) =>
          forkJoin([
            this.annualProgramService.getOne(params['annual-program-id'], undefined, [
              AnnualProgramExpand.programBooks
            ]),
            of(params['program-book'] ? [params['program-book']] : null)
          ])
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(([annualProgram, books]) => {
        const programBooks = books
          ? books
          : this.programBookService.filterByStatusNotNew(annualProgram.programBooks).map(programBook => programBook.id);
        this.resetFilters(annualProgram.year);
        this.globalFilterService.patch({
          programBooks
        });
      });
  }

  private resetFilters(year: number) {
    this.globalFilterService.filter = {
      shownElements: [GlobalFilterShownElement.projects]
    };
    this.yearsForm.patchValue({
      yearSelect: year,
      pastProjectsVisible: false,
      futureProjectsVisible: false,
      endYear: 0
    });
  }

  private initYearFilter(): void {
    const yearSelectFormControl = this.yearsForm.controls.yearSelect;
    this.projectService.patchFilter({ fromYear: yearSelectFormControl.value });
  }

  public async initMap(): Promise<void> {
    const pastProjectsVisible = this.yearsForm.value.pastProjectsVisible;
    await this.mapService.setLayerVisibility(
      [MapLogicLayer.pastProjectAreas, MapLogicLayer.pastProjectPins],
      pastProjectsVisible
    );
    this.onFormValueChanges(this.yearsForm.value);
  }

  public mapNavigateToItem(value: any): void {
    if (value?.id) {
      void this.mapNavigationService.navigateToSelection(value);
    }
  }

  public mapNavigateToSearchResult(term: string): void {
    if (this.searchObjectsService.isSearchTermValid(term)) {
      void this.mapNavigationService.navigateTo(MapOutlet.rightPanel, ['search-results', term]);
    }
  }

  public onSearchBoxClear(): void {
    void this.routeService.clearOutlet('rightPanel');
  }

  private onFormValueChanges(value: IPlanningBookComponentFormValue, typeFilter?: TypeFilter): void {
    const presentYear = +value.yearSelect;
    const pastYear = max([
      value.pastProjectsVisible && value.pastYear ? presentYear - +value.pastYear : presentYear,
      MIN_YEAR_SEARCH
    ]);
    const futureYear = value.futureProjectsVisible && value.endYear ? presentYear + +value.endYear : presentYear;
    this.updateYearFilters(pastYear, futureYear, presentYear);
  }

  private updateYearFilters(pastYear: number, futureYear: number, presentYear: number): void {
    this.projectService.patchFilter({
      fromEndYear: pastYear,
      toStartYear: futureYear
    });
    this.interventionService.patchFilter({
      fromPlanificationYear: pastYear,
      toPlanificationYear: futureYear
    });

    this.annualProgramService.patchYears(pastYear, futureYear);

    this.rtuPojectService.patchFilter({
      fromDateEnd: pastYear
        ? Utils.generateDatesFromYear(pastYear).firstDate
        : Utils.generateDatesFromYear(presentYear).firstDate,
      toDateStart: futureYear
        ? Utils.generateDatesFromYear(futureYear).lastDate
        : Utils.generateDatesFromYear(presentYear).lastDate
    });
  }
}
