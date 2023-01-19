import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  AnnualProgramExpand,
  IEnrichedAnnualProgram,
  ITaxonomy,
  ITaxonomyAssetType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { isEqual } from 'lodash';
import { distinct, map, startWith, take, takeUntil } from 'rxjs/operators';
import { IProjectFilter } from 'src/app/export/project-data-table/project-data-table.component';
import { BaseComponent } from '../../components/base/base.component';
import { markAllAsTouched } from '../../forms/forms.utils';
import { ANNUAL_PROGRAM_FIELDS, IAnnualProgramFindOptions } from '../../models/findOptions/annualProgramFindOptions';
import { AnnualProgramService } from '../../services/annual-program.service';
import { TaxonomiesService } from '../../services/taxonomies.service';
import { UserService } from '../../user/user.service';
import { CustomValidators } from '../../validators/custom-validators';

@Component({
  selector: 'app-customize-project-filter-view',
  templateUrl: './customize-project-filter-view.component.html',
  styleUrls: ['./customize-project-filter-view.component.scss']
})
export class CustomizeProjectFilterViewComponent extends BaseComponent {
  public form: FormGroup;
  public hasPermission: boolean;
  public oldData = {
    fromEndYear: null,
    toStartYear: null,
    executorId: []
  };

  public annualPrograms;
  public carnet = [];
  public fullCarnet = [];
  public tmpCarnetSelected = [];

  public projectTypeId$ = this.taxonomiesService.group(TaxonomyGroup.projectType).pipe(take(1));
  public categoryId$ = this.taxonomiesService.group(TaxonomyGroup.projectCategory).pipe(take(1));
  public subCategoryId$ = this.taxonomiesService.group(TaxonomyGroup.projectSubCategory).pipe(take(1));
  public status$ = this.taxonomiesService.group(TaxonomyGroup.projectStatus).pipe(take(1));
  public boroughId$ = this.taxonomiesService.group(TaxonomyGroup.borough).pipe(take(1));
  public executorId$ = this.taxonomiesService.group(TaxonomyGroup.executor).pipe(take(1));
  public medalId$ = this.taxonomiesService.group(TaxonomyGroup.medalType).pipe(take(1));
  public programId$ = this.taxonomiesService.group(TaxonomyGroup.programType).pipe(take(1));
  public interventionAssetTypeId$ = this.taxonomiesService
    .group(TaxonomyGroup.assetType)
    .pipe(map(x => x.filter(t => !t.properties.consultationOnly)));

  public workTypeId$ = this.taxonomiesService.group(TaxonomyGroup.workType).pipe(take(1));

  public ERROR_YEAR_MIN_MAX_MSG = 'Les années entrées doivent être entre 2000 et 3000.';

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder,
    private readonly taxonomiesService: TaxonomiesService,
    public readonly userService: UserService,
    public readonly annualProgramService: AnnualProgramService
  ) {
    super();
  }

  private createForm(): void {
    this.form = this.fb.group({
      fromEndYear: [null, [CustomValidators.min(2000), Validators.max(3000)]],
      toStartYear: [null, [CustomValidators.min(2000), Validators.max(3000)]],
      projectTypeId: [[]],
      boroughId: [[]],
      interventionProgramId: [[]],
      categoryId: [[]],
      subCategoryId: [[]],
      status: [[]],
      executorId: [[]],
      fromBudget: [null],
      toBudget: [null],
      programId: [[]],
      interventionAssetTypeId: [[]],
      medalId: [[]],
      workTypeId: [[]],
      annualProgram: [[]],
      carnet: [[]],
      submissionNumber: [[]],
      isGeolocated: [[]]
    });
    this.form.setValidators([
      CustomValidators.formRange('fromEndYear', 'toStartYear', 'rangePlanificationYear'),
      CustomValidators.formRange('fromBudget', 'toBudget', 'rangeBudget'),
      CustomValidators.submissionNumbers('submissionNumber')
    ]);
  }

  // tslint:disable-next-line: cyclomatic-complexity
  public initialize(filters: IProjectFilter, hasPermission: boolean): void {
    this.hasPermission = hasPermission;
    this.createForm();
    if (filters) {
      this.form.reset({
        fromEndYear: filters.fromEndYear || null,
        toStartYear: filters.toStartYear || null,
        projectTypeId: filters.projectTypeId || [],
        categoryId: filters.categoryId || [],
        subCategoryId: filters.subCategoryId || [],
        boroughId: filters.boroughId || [],
        interventionProgramId: filters.interventionProgramId || [],
        interventionAssetTypeId: filters.interventionAssetTypeId || [],
        status: filters.status || [],
        executorId: filters.executorId || [],
        fromBudget: filters.fromBudget || null,
        toBudget: filters.toBudget || null,
        medalId: filters.medalId || [],
        workTypeId: filters.workTypeId || [],
        annualProgram: filters.annualProgram || null,
        carnet: [],
        submissionNumber: filters.submissionNumber || null,
        isGeolocated: filters.isGeolocated ?? null
      });
      this.tmpCarnetSelected = filters.carnet;
    }
  }

  public saveTableView(): void {
    markAllAsTouched(this.form);
    if (this.form.valid) {
      this.form.value.fromEndYear = this.form.value.fromEndYear ? parseInt(this.form.value.fromEndYear, 10) : null;
      this.form.value.toStartYear = this.form.value.toStartYear ? parseInt(this.form.value.toStartYear, 10) : null;
      this.form.value.submissionNumber = this.formatSubmissionNumbers(this.form.get('submissionNumber').value);
      this.activeModal.close({ filterResult: this.form.value, allCarnets: this.carnet.map(el => el.id) });
    }
  }
  private formatSubmissionNumbers(value: string): string {
    try {
      return value.replace(/\s/g, '');
    } catch (e) {
      return null;
    }
  }

  public resetTableView(): void {
    this.form.get('carnet').setValue([]);
    this.form.reset({
      fromEndYear: null,
      toStartYear: null,
      boroughId: [],
      projectTypeId: [],
      executorId: [],
      fromBudget: null,
      toBudget: null,
      interventionProgramId: [],
      interventionAssetTypeId: [],
      medalId: [],
      workTypeId: [],
      annualProgram: null,
      carnet: [],
      submissionNumber: null,
      isGeolocated: null
    });
  }

  public cancel(): void {
    this.activeModal.close({ filterResult: undefined, allCarnets: [] });
  }

  public updateCarnetItems(event): void {
    this.form.get('carnet').setValue([]);
    this.form.value.carnet = [];
    this.carnet = [];
    if (event) {
      this.carnet = this.fullCarnet[event];
    }
  }

  public get programmeAnnuelDisable(): boolean {
    const fromEndYear =
      this.form.value.fromEndYear &&
      parseInt(this.form.value.fromEndYear, 10) >= 2000 &&
      parseInt(this.form.value.fromEndYear, 10) <= 3000;
    const toStartYear =
      this.form.value.toStartYear &&
      parseInt(this.form.value.toStartYear, 10) >= 2000 &&
      parseInt(this.form.value.toStartYear, 10) <= 3000;
    const canView = (fromEndYear || toStartYear) && this.form.value.executorId.length > 0;
    const shouldUpdate = this.shouldLoadPA(
      this.form.value.fromEndYear,
      this.form.value.toStartYear,
      this.form.value.executorId
    );
    if (shouldUpdate) {
      if (canView) {
        this.getAnnualPrograms();
      } else {
        this.form.get('annualProgram').setValue(null);
      }
    }
    return !canView;
  }

  public getAnnualPrograms(): void {
    this.annualProgramService.annualProgramChanged$
      .pipe(startWith(null), takeUntil(this.destroy$), distinct())
      .subscribe(async data => {
        const res = await this.getAnnualProgramsByOptions();
      });
  }

  public async getAnnualProgramsByOptions(): Promise<IEnrichedAnnualProgram[]> {
    const searchRequest: IAnnualProgramFindOptions = {
      executorId: this.form.value.executorId,
      fields: [
        ANNUAL_PROGRAM_FIELDS.ID,
        ANNUAL_PROGRAM_FIELDS.EXECUTOR_ID,
        ANNUAL_PROGRAM_FIELDS.YEAR,
        ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_ID,
        ANNUAL_PROGRAM_FIELDS.PROGRAM_BOOK_NAME
      ],
      expand: AnnualProgramExpand.programBooks,
      limit: 100000,
      offset: 0
    };
    if (this.form.value.fromEndYear) {
      searchRequest.fromYear = this.form.value.fromEndYear;
    }
    if (this.form.value.toStartYear) {
      searchRequest.toYear = this.form.value.toStartYear;
    }
    const annualPrograms = await this.annualProgramService.getAnnualProgramsFilterByOptions(searchRequest);
    const requestorsTaxo: ITaxonomy[] = await this.taxonomiesService
      .group(TaxonomyGroup.requestor)
      .pipe(take(1))
      .toPromise();

    this.form.value.annualProgram = annualPrograms.items.find(el => el.id === this.form.value.annualProgram)
      ? this.form.value.annualProgram
      : null;
    this.carnet = [];
    this.annualPrograms = annualPrograms.items.map(el => ({
      value: el.id,
      label: { fr: `${requestorsTaxo.find(elem => elem.code === el.executorId)?.label.fr} ${el.year}` }
    }));

    annualPrograms.items.forEach(el => {
      this.fullCarnet[el.id] = el.programBooks.map(elem => ({
        id: elem.id,
        label: {
          fr: elem.name
        }
      }));
    });

    // init annualPrograms and carnet items-values
    this.carnet =
      this.form.value.annualProgram && this.fullCarnet[this.form.value.annualProgram]
        ? this.fullCarnet[this.form.value.annualProgram]
        : [];
    this.form.get('carnet').setValue(this.tmpCarnetSelected);
    this.tmpCarnetSelected = [];
    return this.annualPrograms;
  }

  public shouldLoadPA = (fromEndYear: string, toStartYear: string, executorId: [string]): boolean => {
    if (
      this.oldData.fromEndYear !== fromEndYear ||
      this.oldData.toStartYear !== toStartYear ||
      !isEqual(this.oldData.executorId, executorId.sort())
    ) {
      this.oldData = {
        fromEndYear,
        toStartYear,
        executorId: executorId.sort()
      };
      return true;
    }
    return false;
  };
  public setIsGeolocated(value: boolean): void {
    this.form.get('isGeolocated').setValue(value);
  }
}
