import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import {
  AnnualProgramExpand,
  IEnrichedProgramBook,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { flatten, isEmpty } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, take, takeUntil, tap } from 'rxjs/operators';
import { IKeyValue } from 'src/app/map/config/layers/utils';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { IGlobalFavorite } from 'src/app/shared/models/favorite/global-favorite';
import { IGlobalFilter } from 'src/app/shared/models/filters/global-filter';
import { GlobalFilterShownElement } from 'src/app/shared/models/filters/global-filter-shown-element';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { GlobalFavoriteService } from 'src/app/shared/services/filters/global-favorite.service';
import { GlobalLayerService } from 'src/app/shared/services/global-layer.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { GlobalLayerLabelService } from 'src/app/shared/services/layer/global-layer-label.service';
import { MapService } from 'src/app/shared/services/map.service';
import { ProjectService } from 'src/app/shared/services/project.service';

import { defaultAnnualProgramFields } from '../../../../program-book/program-book-fields';
import { IGlobalLabel } from '../../../../shared/models/filters/global-filter-label';
import { GlobalFilterLabelService } from '../../../../shared/services/filters/global-filter-label.service';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from '../../../../shared/services/filters/global-filter.service';
import { IRtuPartnerByCategory, RtuProjectService } from '../../../../shared/services/rtu-project.service';
import { TaxonomiesService } from '../../../../shared/services/taxonomies.service';
import { SaveFavoriteModalComponent } from '../favorites/save-favorite-modal/save-favorite-modal.component';

interface IElementAndSubject {
  element: GlobalFilterShownElement;
  isShown: Observable<boolean>;
}

@Component({
  selector: 'app-current-selection',
  templateUrl: './current-selection.component.html',
  styleUrls: ['./current-selection.component.scss']
})
export class CurrentSelectionComponent extends BaseComponent implements OnInit, OnDestroy {
  public programBooks: IEnrichedProgramBook[];
  public form: FormGroup;
  public isLoading = true;
  public labels$: Observable<IGlobalLabel[]>;
  public selectedFavorite$ = this.globalFavoriteService.selectedFavorite$.pipe(takeUntil(this.destroy$));
  public currentFavorite: IGlobalFavorite;
  public labelsControl = new FormControl([]);
  public isProjectSectionOpened = true;
  private rtuPartnerByCategory: IRtuPartnerByCategory;
  public shownElementsType: string;
  public selectedItems: IGlobalLabel[];
  public reloadFilter$: Observable<IGlobalFilter>;

  private readonly formControlsAndShownElements: IKeyValue<IElementAndSubject>;

  constructor(
    private readonly annualProgramService: AnnualProgramService,
    private readonly dialogsService: DialogsService,
    private readonly fb: FormBuilder,
    private readonly globalLayerService: GlobalLayerService,
    private readonly globalFilterService: GlobalFilterService,
    private readonly interventionsService: InterventionService,
    private readonly projectService: ProjectService,
    private readonly rtuProjectService: RtuProjectService,
    private readonly globalFilterLabelService: GlobalFilterLabelService,
    private readonly globalLayerLabelService: GlobalLayerLabelService,
    private readonly taxonomiesService: TaxonomiesService,
    public globalFavoriteService: GlobalFavoriteService,
    private readonly mapService: MapService
  ) {
    super();
    this.formControlsAndShownElements = {
      projectsVisible: {
        element: GlobalFilterShownElement.projects,
        isShown: this.projectService.projectsShown$
      },
      partnerProjectsVisible: {
        element: GlobalFilterShownElement.partnerProjects,
        isShown: this.rtuProjectService.partnerProjectsShown$
      },
      linkedCityProjectsVisible: {
        element: GlobalFilterShownElement.linkedCityProjects,
        isShown: this.rtuProjectService.linkedCityProjectsShown$
      },
      boroughProjectsVisible: {
        element: GlobalFilterShownElement.boroughProjects,
        isShown: this.rtuProjectService.boroughProjects$
      },
      interventionsVisible: {
        element: GlobalFilterShownElement.interventions,
        isShown: this.interventionsService.interventionsShown$
      }
    };
  }

  public ngOnInit(): void {
    this.initForm();
    this.initTaxonomies();
    this.initFormSubscriptions();
    this.initLabels();
    this.initFavoriteSelectionSubscription();
    this.initShownElementsSubscription();
  }

  private initForm(): void {
    let formGroup = {};
    Object.keys(this.formControlsAndShownElements).forEach(key => {
      formGroup = {
        ...formGroup,
        [key]: []
      };
    });
    this.form = this.fb.group(formGroup);
  }

  private initTaxonomies(): void {
    this.taxonomiesService
      .group(TaxonomyGroup.infoRtuPartner)
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(x => (this.rtuPartnerByCategory = this.rtuProjectService.getPartnerIdsByCategory(x)));
  }

  private initFormSubscriptions(): void {
    let triggeredBy: string;
    let currentShownElements = this.globalFilterService.filter?.shownElements;
    this.reloadFilter$ = combineLatest(
      this.form.valueChanges.pipe(
        takeUntil(this.destroy$),
        debounceTime(GLOBAL_FILTER_DEBOUNCE),
        distinctUntilChanged(),
        tap(() => (triggeredBy = 'form'))
      ),
      this.labelsControl.valueChanges.pipe(
        takeUntil(this.destroy$),
        debounceTime(GLOBAL_FILTER_DEBOUNCE),
        distinctUntilChanged(),
        tap(() => (triggeredBy = 'labels'))
      )
    ).pipe(
      takeUntil(this.destroy$),
      map(([formValue, keys]: [string[], string[]]) => {
        // Some lables combine mltiple filters with comma separated values
        // example interventionStatuses.waiting,decisionTypeId.revisionRequest,...
        const labelKeys = flatten(keys.map(el => el.split(',')));
        const shownElements: GlobalFilterShownElement[] = [];
        let filter = this.globalFilterService.filter;

        if (triggeredBy === 'form') {
          Object.keys(this.formControlsAndShownElements).forEach(formControl => {
            if (formValue[formControl]) {
              shownElements.push(this.formControlsAndShownElements[formControl].element);
            }
          });
          currentShownElements = shownElements;
        }
        if (triggeredBy === 'labels') {
          const cleanLayer = this.globalLayerLabelService.pickLayer(this.globalLayerService.layer, labelKeys);
          this.globalLayerService.layer = cleanLayer;
          filter = this.globalFilterService.pickFilter(this.globalFilterService.filter, labelKeys);
          if (filter.shownElements !== currentShownElements) {
            currentShownElements = filter.shownElements;
          }
          if (isEmpty(filter) || !filter.shownElements?.length) {
            currentShownElements = [];
          }
        }
        return {
          ...filter,
          shownElements: currentShownElements
        };
      })
    );
    this.reloadFilter$
      .pipe(startWith(this.globalFilterService.filter), takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(filter => {
        this.globalFilterService.filter = filter;
      });

    // Keep it at the end to subscribe to formValueChanges or it wont fire
    Object.keys(this.formControlsAndShownElements).forEach(formControlName => {
      this.formControlsAndShownElements[formControlName].isShown
        .pipe(takeUntil(this.destroy$), distinctUntilChanged())
        .subscribe(s => {
          this.form.controls[formControlName].setValue(s);
        });
    });
  }

  private initLabels(): void {
    if (!this.globalFilterService.filter.programBooks) {
      return this.createLabelsObservable([]);
    }
    this.annualProgramService
      .getCachedAnnualPrograms(defaultAnnualProgramFields, [AnnualProgramExpand.programBooks])
      .then(annualPrograms => {
        this.programBooks = flatten(annualPrograms.items.map(a => a.programBooks));
        this.createLabelsObservable(this.programBooks);
      })
      .catch(() => undefined);
    return;
  }

  private createLabelsObservable(programBooks: IEnrichedProgramBook[]): void {
    const filterLabels$ = this.globalFilterLabelService.createFilterLabelsObservable(programBooks, this.destroy$);
    const layerLabels$ = this.globalLayerLabelService.createLayerLabelsObservable(this.destroy$);
    this.labels$ = combineLatest(filterLabels$, layerLabels$).pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged(),
      map(([filter, layer]) => [...filter, ...layer])
    );

    this.labels$.pipe(takeUntil(this.destroy$), distinctUntilChanged()).subscribe(labels => {
      const labelKeys = labels.map(label => label.key);
      this.labelsControl.setValue(labelKeys);
      this.selectedItems = labels;
    });
    this.isLoading = false;
  }

  private initFavoriteSelectionSubscription(): void {
    this.selectedFavorite$.pipe(takeUntil(this.destroy$)).subscribe(fav => (this.currentFavorite = fav));
  }

  private initShownElementsSubscription(): void {
    this.globalFilterService.filter$.pipe(takeUntil(this.destroy$)).subscribe(x => {
      setTimeout(() => {
        Object.keys(this.formControlsAndShownElements).forEach(formControl => {
          if (x[formControl]) {
            this.form.controls[formControl].setValue(
              !x.shownElements?.length ||
                x.shownElements.includes(this.formControlsAndShownElements[formControl].element),
              { emitEvent: false }
            );
          }
        });
      });
    });
  }

  public async openSaveModal(): Promise<void> {
    const modal = this.dialogsService.showModal(SaveFavoriteModalComponent);
    await modal.result;
  }

  public clearCurrentSelection(): void {
    this.globalFilterService.resetFilter();
    this.mapService.setZoom(0);
  }

  public toggleProjectSection(): void {
    this.isProjectSectionOpened = !this.isProjectSectionOpened;
  }
}
