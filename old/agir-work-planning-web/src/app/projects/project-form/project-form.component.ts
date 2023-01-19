import { Component, EventEmitter, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbCalendar, NgbDateStruct, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as turf from '@turf/turf';
import {
  GeometryUtil,
  IBudget,
  IEnrichedIntervention,
  IEnrichedProject,
  IGeometry,
  InterventionStatus,
  IPlainIntervention,
  IPlainProject,
  ITaxonomy,
  ITaxonomyList,
  ProjectExpand,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Geometry } from 'geojson';
import { cloneDeep, isEmpty, isEqual, max, maxBy, minBy, remove, sumBy, uniq } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of, zip } from 'rxjs';
import { debounceTime, filter, map, shareReplay, skip, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import {
  mapInterventionCreationLayerIds,
  mapInterventionLayerIds
} from 'src/app/map/config/layers/logic-layers/interventions/map-intervention-layer-ids';
import { mapProjectAreaLayerIds } from 'src/app/map/config/layers/logic-layers/projects/map-project-area-layer-ids';
import {
  plannedProjectLayerIds,
  postponedProjectLayerIds,
  projectLayerIds,
  replannedProjectLayerIds
} from 'src/app/map/config/layers/map-enums';
import { MapComponent } from 'src/app/map/map.component';
import { AlertType } from 'src/app/shared/alerts/alert/alert.component';
import { arrayOfNumbers } from 'src/app/shared/arrays/number-arrays';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import {
  InterventionListComponent,
  ISelectedIntervention
} from 'src/app/shared/components/intervention-list/intervention-list.component';
import { SpinnerOverlayService } from 'src/app/shared/components/spinner-overlay/spinner-overlay.service';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { ConfirmationModalCloseType } from 'src/app/shared/forms/confirmation-modal/confirmation-modal.component';
import { bboxToHttpParam } from 'src/app/shared/http/spatial';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { AssetService } from 'src/app/shared/services/asset.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapService } from 'src/app/shared/services/map.service';
import { IYearInterval, ProjectService } from 'src/app/shared/services/project.service';
import { SpatialAnalysisService } from 'src/app/shared/services/spatial-analysis.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { WorkAreaService } from 'src/app/shared/services/workArea.service';
import { RestrictionType, UserRestrictionsService } from 'src/app/shared/user/user-restrictions.service';
import { BroadcastEventException } from 'src/app/shared/window/window-broadcast.service';

import { markAllAsTouched } from '../../shared/forms/forms.utils';
import { MapSourceId } from '../../shared/services/map-source.service';
import { SelectionMode } from '../../shared/services/map.service';
import { CustomValidators } from '../../shared/validators/custom-validators';

const PROJECT_DUPLICATE_DEBOUNCE = 1000;
const INTERVENTIONS_LIST_MAP_SOURCE_DEBOUNCE = 200;
const PROJECT_YEAR_INTERVAL_MAX_RANGE = 10;
const INTERVENTIONS_VALID_STATUSES: string[] = [
  InterventionStatus.integrated,
  InterventionStatus.waiting,
  InterventionStatus.accepted
];

interface IFilterTaxonomies {
  projectTypes?: ITaxonomyList;
  executors?: ITaxonomyList;
  projectSubCategories?: ITaxonomyList;
  boroughs?: ITaxonomyList;
  requestors?: ITaxonomyList;
  projectCategories?: ITaxonomyList;
  services?: ITaxonomyList;
}

const AREA_LAYER_IDS = [
  ...mapInterventionLayerIds,
  ...mapInterventionCreationLayerIds,
  ...plannedProjectLayerIds,
  ...replannedProjectLayerIds,
  ...postponedProjectLayerIds,
  ...projectLayerIds
];

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent extends BaseComponent implements OnInit, OnDestroy {
  private _projectArea: IGeometry;
  private readonly projectAreaChanged = new EventEmitter<IGeometry>();
  private projectUpsert: IPlainProject;
  private currentGeometryEdit: Geometry;
  private originalProject: IEnrichedProject;

  public isMapLoading = true;
  public form: FormGroup;
  public taxos: IFilterTaxonomies = {};
  public interventionsBudget: number;
  public interventionsListSubject = new BehaviorSubject<IEnrichedIntervention[]>([]);
  public interventionsList$ = this.interventionsListSubject.asObservable();
  public get interventionsList(): IEnrichedIntervention[] {
    return this.interventionsListSubject.getValue();
  }

  public geometryEditorActivated = false;
  public currentDate: NgbDateStruct;
  public isNonGeolocatedProject = false;
  public currentYear: number = new Date().getFullYear();
  public currentStartYear: number;
  public currentEndYear: number;
  public startYear$: Observable<string>;
  public endYear$: Observable<string>;
  @ViewChild('map') public map: MapComponent;
  @ViewChild('interventionList') public interventionList: InterventionListComponent;
  private nonIntegratedInterventions$: Observable<IEnrichedIntervention[]>;
  public interventions: Observable<ISelectedIntervention[]>;
  private hoveredInterventions: ISelectedIntervention[] = [];
  public generatingProjectArea = false;
  public initialRequestors$: Observable<ITaxonomy[]>;
  private selectedProjectInChargeInitialized = false;
  public canInteract = false;

  public get projectArea(): IGeometry {
    return this._projectArea;
  }

  public set projectArea(v: IGeometry) {
    this._projectArea = v;
    this.projectAreaChanged.emit(this._projectArea);
  }

  public get title(): string {
    return this.selectedProject ? `Modification du projet ${this.selectedProject.id}` : `Création d'un projet`;
  }

  public get btnLabel(): string {
    return this.selectedProject ? `Modifier` : `Créer`;
  }

  public projects: IEnrichedProject[];
  public selectedProject: IEnrichedProject;
  public submitting = false;
  public duplicateProject$: Observable<IEnrichedProject>;
  public invalidGeometriesInterventionIds: string[] = [];

  public addingIntervention = false;
  public interventions$: Observable<IEnrichedIntervention>[];
  public get endYears$(): Observable<number[]> {
    return this.interventionsList$.pipe(
      map(() => {
        return this.endYearInterval ? arrayOfNumbers(this.endYearInterval.min, this.endYearInterval.max, 1) : [];
      })
    );
  }

  public get startYears$(): Observable<number[]> {
    return this.interventionsList$.pipe(
      map(() => {
        return this.startYearInterval ? arrayOfNumbers(this.startYearInterval.min, this.startYearInterval.max, 1) : [];
      })
    );
  }

  private get endYearInterval(): IYearInterval {
    const isGeolocated = this.isGeolocated(this.selectedProject as IPlainProject);
    const minYear = this.interventionsList.length
      ? max(this.interventionsList.map(el => el.planificationYear))
      : isGeolocated && !isGeolocated.value
      ? this.form.getRawValue().startYear
      : this.currentYear;
    const maxYear = minYear + PROJECT_YEAR_INTERVAL_MAX_RANGE;
    return { min: minYear, max: maxYear };
  }

  private get startYearInterval(): IYearInterval {
    if (!this.interventionsList.length) {
      return { min: this.currentYear, max: this.currentYear + PROJECT_YEAR_INTERVAL_MAX_RANGE };
    }

    const minYear = minBy(this.interventionsList, i => i.planificationYear).planificationYear;
    const maxYear = maxBy(this.interventionsList, i => i.planificationYear).planificationYear;
    return { min: minYear, max: maxYear };
  }

  public get interventionsBoroughs(): ITaxonomy[] {
    if (this.isNonGeolocatedProject) {
      return this.taxos.boroughs;
    }
    const boroughsList = this.interventionsList.map(x => x.boroughId);
    return this.taxos.boroughs ? this.taxos.boroughs.filter(x => boroughsList.includes(x.code)) : [];
  }

  public get canSubmit(): boolean {
    return (
      this.form.valid &&
      !this.invalidGeometriesInterventionIds.length &&
      !this.geometryEditorActivated &&
      !this.submitting &&
      !this.generatingProjectArea
    );
  }

  public get preventMapInteractions(): boolean {
    return this.isNonGeolocatedProject || this.generatingProjectArea;
  }

  public get isBudgetRequired(): boolean {
    return this.isNonGeolocatedProject;
  }

  private get isCreationMode(): boolean {
    return !this.selectedProject;
  }

  constructor(
    private readonly calendar: NgbCalendar,
    private readonly formBuilder: FormBuilder,
    public interventionService: InterventionService,
    private readonly router: Router,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly mapService: MapService,
    private readonly projectService: ProjectService,
    private readonly notificationsService: NotificationsService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly modalService: NgbModal,
    private readonly workAreaService: WorkAreaService,
    private readonly dialogsService: DialogsService,
    private readonly spatialAnalysisService: SpatialAnalysisService,
    private readonly assetService: AssetService,
    private readonly spinnerOverlayService: SpinnerOverlayService,
    private readonly userRestrictionsService: UserRestrictionsService
  ) {
    super();
    this.currentDate = this.calendar.getToday();
  }

  public ngOnInit(): void {
    this.spinnerOverlayService.show('Chargement du projet en cours');
    this.form = this.createForm();
    this.projectService.isCreating = true;

    this.form.controls.projectType.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.generateProjectName();
    });

    combineLatest(of(this.loadTaxonomies()), this.mapService.mapLoaded$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.activatedRoute.params.subscribe(async params => {
          if (isEmpty(params)) {
            this.canInteract = true;
            this.initNonGeolocatedProjectCreation();
          }
          if (params.id) {
            await this.updateFromProject(params.id);
          }

          if (params.interventionId) {
            this.canInteract = true;
            const intervention = await this.interventionService.getIntervention<IEnrichedIntervention>(
              params.interventionId
            );
            await this.addIntervention(intervention);
            this.form.controls.startYear.setValue(intervention.planificationYear);
            this.form.controls.endYear.setValue(intervention.planificationYear);
            this.mapService.fitZoomToGeometry(intervention.interventionArea.geometry);
          }
          this.duplicateProject$ = this.getDuplicateProjectObservable();
          this.initInitialRequestors();
          this.initProjectYears();
          this.spinnerOverlayService.hide();
        });
        this.initMap();
      });

    combineLatest(this.projectAreaChanged.asObservable(), this.interventionsListSubject).subscribe(
      ([projectArea, interventions]) => {
        if (!projectArea || !interventions.length) {
          return;
        }
        this.invalidGeometriesInterventionIds =
          GeometryUtil.validateProjectContainsIntervention(
            { geometry: projectArea } as any,
            interventions as IPlainIntervention[]
          ) || [];
      }
    );
  }

  private initMap(): void {
    this.initMapLayers();
    this.initMapYearRangeProjectColor();
    this.initNonIntegratedInterventions();
    this.initInterventionsList();
    this.initInterventions();
    this.initMapAssets();
    this.setExecutor();

    this.projectService.searchProjectResults$.subscribe(x => {
      this.projects = x;
    });

    // Set selection mode to Intervention Area
    this.mapService.zoomSelect = false;
    this.mapService.setSelectionMode(SelectionMode.interventionArea);
    this.map.selectionService.interventionSelected$.subscribe(async intervention => {
      await this.addIntervention(intervention);
    });
    this.isMapLoading = false;
  }

  private initMapLayers(): void {
    this.mapService.setLayersZoomRange(mapProjectAreaLayerIds, 0);
  }

  private initMapYearRangeProjectColor(): void {
    this.startYear$ = this.form.get('startYear').valueChanges.pipe(startWith(this.currentYear)) as Observable<string>;
    this.endYear$ = this.form.get('endYear').valueChanges.pipe(startWith(this.currentYear)) as Observable<string>;
    this.startYear$.subscribe(startYear => {
      // tslint:disable-next-line: radix
      this.currentStartYear = parseInt(startYear);
      this.refreshProjectAreaDisplay();
    });
    this.endYear$.subscribe(endYear => {
      // tslint:disable-next-line: radix
      this.currentEndYear = parseInt(endYear);
      this.refreshProjectAreaDisplay();
    });
  }

  private initNonIntegratedInterventions(): void {
    this.nonIntegratedInterventions$ = combineLatest(
      this.mapService.viewport$,
      this.interventionsListSubject.asObservable()
    ).pipe(
      takeUntil(this.destroy$),
      debounceTime(200),
      filter(() => !this.isNonGeolocatedProject),
      switchMap(([viewport]) => {
        return this.interventionService.searchInterventions({
          interventionAreaBbox: bboxToHttpParam(viewport),
          executorId: this.originalProject?.executorId,
          status: INTERVENTIONS_VALID_STATUSES,
          project: 'null', // Note: using 'null' is more explicit, we could specifiy etiehr empty string ''   or  'null', either case is  supported by BE
          decisionRequired: false
        });
      }),
      map(interventions => {
        this.map.sourceService.setInterventionAreasSecondary(interventions);
        return interventions.filter(intervention => {
          return (
            !this.interventionsList.find(x => x.id === intervention.id) &&
            (!intervention.project || intervention.project.id === this.selectedProject?.id)
          );
        });
      })
    );
  }

  private initInterventionsList(): void {
    this.interventionsListSubject
      .asObservable()
      .pipe(skip(1), debounceTime(INTERVENTIONS_LIST_MAP_SOURCE_DEBOUNCE))
      .subscribe(interventions => {
        this.map.sourceService.setInterventionAreas(interventions);
      });
  }

  private initInterventions(): void {
    this.interventions = combineLatest(
      this.nonIntegratedInterventions$.pipe(startWith([])),
      this.interventionsListSubject
    ).pipe(
      map(([nonIntegratedInterventions, interventionList]): IEnrichedIntervention[] => {
        const interventionsUnion = this.interventionsUnion(nonIntegratedInterventions, interventionList);
        return !isEmpty(this.interventionsList)
          ? interventionsUnion.filter(e => e.executorId === this.interventionsList[0].executorId)
          : [];
      }),
      map((interventionList): ISelectedIntervention[] =>
        interventionList.map(intervention => {
          return {
            intervention,
            assets: this.assetService.getSelectedAssetsFromIntervention(intervention)
          };
        })
      )
    );
  }

  private initInitialRequestors(): void {
    this.initialRequestors$ = combineLatest(
      this.taxonomiesService.group(TaxonomyGroup.requestor).pipe(takeUntil(this.destroy$)),
      this.form.controls.projectType.valueChanges.pipe(startWith(this.form.value.projectType)) as Observable<ITaxonomy>,
      this.interventionsListSubject
    ).pipe(
      map(([taxonomies, projectType, interventions]) => {
        if (projectType?.code === ProjectType.integratedgp) {
          return taxonomies;
        }
        const interventionRequestorIds = uniq(interventions.map(x => x.requestorId));
        return taxonomies.filter(x => interventionRequestorIds.includes(x.code));
      })
    );
    this.interventionsListSubject.subscribe(() => this.form.controls.inChargeId.setValue(null));
    this.initialRequestors$.subscribe(initialRequestors => {
      this.updateInChargeId(initialRequestors);
    });
  }

  private initProjectYears(): void {
    this.addValidatorsToForm();

    // Set start year and end year when intervention list change (Creation mode only)
    this.interventionsListSubject.pipe(takeUntil(this.destroy$)).subscribe(interventions => {
      if (!this.isCreationMode || !interventions?.length) {
        return;
      }
      this.form.controls.startYear.setValue(minBy(interventions, i => i.planificationYear).planificationYear);
      this.form.controls.endYear.setValue(maxBy(interventions, i => i.planificationYear).planificationYear);
    });
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.projectService.isCreating = false;
    if (!this.isNonGeolocatedProject) {
      this.mapService.zoomSelect = true;
    }
  }

  private getDuplicateProjectObservable(): Observable<IEnrichedProject> | undefined {
    if (this.isNonGeolocatedProject) {
      const currentYear = this.currentYear;
      // Duplicate non-geolocated project project observable
      return combineLatest(
        this.form.get('executor').valueChanges.pipe(startWith(this.form.get('executor').value)) as Observable<
          ITaxonomy
        >,
        this.form.get('boroughs').valueChanges.pipe(startWith(this.form.get('boroughs').value)) as Observable<
          ITaxonomy
        >,
        this.startYear$,
        this.form.get('endYear').valueChanges.pipe(startWith(currentYear)) as Observable<string>
      ).pipe(
        debounceTime(PROJECT_DUPLICATE_DEBOUNCE),
        switchMap(([executor, borough, startYear, endYear]) =>
          this.projectService.getNonGeolocatedDuplicate(+startYear, +endYear, executor?.code, borough?.code)
        ),
        shareReplay()
      );
    }
  }

  public generateProjectName(): void {
    let str = '';
    let streetName: string;
    let roadLength = 0;
    if (this.form.controls.projectType.value) {
      str += this.form.controls.projectType.value.label.fr;
    }
    for (const intervention of this.interventionsList) {
      const feature = intervention.roadSections?.features[0];
      if (!feature) {
        continue;
      }
      const length = turf.length(feature);
      if (length > roadLength) {
        roadLength = length;

        streetName = feature.properties.name;
      }
    }
    if (streetName) {
      if (str.length) {
        str += ' / ';
      }
      str += streetName;
    }
    this.form.controls.projectName.setValue(str);
  }

  public generateStreetName(): string {
    if (!this.interventionsList?.length) {
      return '';
    }
    return this.interventionsList[0]?.roadSections?.features[0]?.properties?.name?.trim();
  }

  private async buildWorkArea(interventions: IEnrichedIntervention[]): Promise<void> {
    this.generatingProjectArea = true;
    try {
      if (interventions.length) {
        const projectArea = await this.projectService.findProjectAreaByInterventions(interventions);
        if (!projectArea) {
          throw new Error('Invalid project area');
        }
        this.projectArea = projectArea;
        const interventionGeometries: IGeometry[] = interventions.map(x => x.interventionArea.geometry);
        const interventionAreaFeature: turf.Feature[] = interventionGeometries.map(x => turf.feature(x));
        this.map.sourceService.setSource(MapSourceId.interventionCreationAreas, interventionAreaFeature);
        this.refreshProjectAreaDisplay();
      } else {
        this.projectArea = null;
        this.map.sourceService.clearSource(MapSourceId.interventionCreationAreas);
        this.refreshProjectAreaDisplay();
      }
    } finally {
      this.generatingProjectArea = false;
    }
  }

  public onCancel(): void {
    window.history.length > 1 ? window.history.back() : window.close();
  }

  private async loadTaxonomies(): Promise<void> {
    const groups = await this.taxonomiesService
      .groups(
        TaxonomyGroup.projectType,
        TaxonomyGroup.executor,
        TaxonomyGroup.projectSubCategory,
        TaxonomyGroup.borough,
        TaxonomyGroup.requestor,
        TaxonomyGroup.projectCategory,
        TaxonomyGroup.service
      )
      .pipe(take(1))
      .toPromise();
    this.taxos = {
      projectTypes: groups[0],
      executors: this.userRestrictionsService.filterTaxonomies(groups[1], RestrictionType.EXECUTOR),
      projectSubCategories: groups[2],
      boroughs: this.userRestrictionsService.filterTaxonomies(groups[3], RestrictionType.BOROUGH),
      requestors: groups[4],
      projectCategories: groups[5],
      services: groups[6]
    };
  }

  public createForm(): FormGroup {
    const form = this.formBuilder.group({
      projectType: [null, Validators.required],
      geolocated: [false],
      executor: [null, Validators.required],
      category: [null],
      startYear: [this.startYearInterval.min],
      endYear: [this.endYearInterval.min],
      inChargeId: [null],
      boroughs: [null, Validators.required],
      projectName: [null, Validators.required],
      globalBudget: [null]
    });
    return form;
  }

  private addValidatorsToForm() {
    combineLatest([this.form.controls.startYear.valueChanges, this.form.controls.endYear.valueChanges])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.controls.startYear.setValidators(CustomValidators.fromDateSequence('startYear', 'endYear'));
        this.form.controls.endYear.setValidators(CustomValidators.fromDateSequence('startYear', 'endYear'));
      });
  }

  private updateInChargeId(initialRequestors: ITaxonomy[]): void {
    const requestorIds = uniq(initialRequestors.map(x => x.code));
    const inChargeId = this.form.get('inChargeId');
    const inChargeIdValue = inChargeId.value;

    const updatedInChargeIdValue = this.getInChargeIdValue(requestorIds, inChargeIdValue);
    if (inChargeIdValue !== updatedInChargeIdValue) {
      inChargeId.setValue(updatedInChargeIdValue);
    }
  }

  private getInChargeIdValue(requestorIds: string[], inChargeIdValue: string): string {
    if (this.selectedProject && !this.selectedProjectInChargeInitialized) {
      this.selectedProjectInChargeInitialized = true;
      return this.selectedProject.inChargeId;
    }
    if (!requestorIds?.length) {
      return null;
    }
    if (requestorIds.length === 1) {
      return requestorIds[0];
    }
    if (requestorIds.includes(inChargeIdValue)) {
      return inChargeIdValue;
    }
    return null;
  }

  public cancel(): void {
    void this.router.navigate(['']);
    this.modalService.dismissAll();
  }

  public async changeType(): Promise<void> {
    if (this.form.controls.projectType.value.code === ProjectType.other) {
      this.form.controls.geolocated.reset({ value: false, disabled: false });
    } else if (this.form.controls.projectType.value.code === ProjectType.nonIntegrated) {
      const interventionsWithProgram = this.interventionsList.filter(intervention => intervention.programId);
      if (!interventionsWithProgram?.length) {
        this.notificationsService.showError(
          'Les interventions doivent contenir un programme afin de créer un projet non-intégré'
        );
        return this.form.controls.projectType.reset(null);
      }
      this.interventionsListSubject.next(interventionsWithProgram);
      await this.buildWorkArea(this.interventionsList);
      this.form.controls.geolocated.reset({ value: true, disabled: true });
    } else {
      this.form.controls.geolocated.reset({ value: true, disabled: true });
    }
  }

  public async addIntervention(intervention: IEnrichedIntervention): Promise<void> {
    this.addingIntervention = true;
    let isValid: boolean;
    if (!intervention.roadSections) {
      // tslint:disable-next-line: no-parameter-reassignment
      intervention = await this.interventionService.getIntervention(intervention.id);
    }
    if (this.selectedProject) {
      if (this.form.controls.projectType.value.code === ProjectType.nonIntegrated && !intervention.programId) {
        this.notificationsService.showError(
          "L'intervention doit contenir un programme afin de l'intégrer à un projet non-intégré"
        );
        return;
      }
      isValid = await this.projectService.validateIntervention(
        intervention,
        this.interventionsList,
        this.selectedProject as IPlainProject
      );
    } else {
      isValid = await this.projectService.validateIntervention(intervention, this.interventionsList);
    }
    if (isValid) {
      this.interventionsListSubject.next([...this.interventionsList, intervention]);
      this.updateFormDetails();
      this.updateInterventionsBudget();
      if (this.selectedProject?.id) {
        this.notificationsService.showSuccess('Votre intervention a bien été ajoutée au projet.');
      }
      try {
        await this.buildWorkArea(this.interventionsList);
      } catch (error) {
        this.notificationsService.showWarning("Il n'est pas possible de générer automatiquement la zone de projet.");
      } finally {
        this.selectDefaultBorough();
      }
    } else {
      this.notificationsService.showWarning("Il n'est pas possible d'ajouter cette intervention au projet.");
    }
    this.addingIntervention = false;
  }

  public async removeIntervention(intervention: IEnrichedIntervention): Promise<void> {
    const interventions = [...this.interventionsList];
    remove(interventions, intervention);

    // if priority services doesn't match interventions requestors then show error
    if (!this.hasMatchServicePriorities(interventions)) {
      this.showMatchServicePrioritiesError();
      return;
    }

    this.interventionsListSubject.next(interventions);

    this.updateFormDetails();
    this.updateInterventionsBudget();
    await this.buildWorkArea(this.interventionsList);
    this.selectDefaultBorough();
  }

  public inInterventionList(interventionId: string): boolean {
    return this.interventionsList.some(x => x.id === interventionId);
  }

  private selectDefaultBorough(): void {
    this.form.controls.boroughs.setValue(
      this.interventionsBoroughs.length === 1 ? this.interventionsBoroughs[0] : null
    );
  }

  private updateFormDetails(): void {
    this.generateProjectName();
  }

  public initUpsertProject(): void {
    this.projectUpsert = {
      projectTypeId: this.form.controls.projectType.value.code,
      projectName: this.form.controls.projectName.value || undefined,
      boroughId: this.form.controls.boroughs.value.code,
      status: null,
      executorId: this.form.controls.executor.value,
      startYear: +this.form.controls.startYear.value,
      endYear: +this.form.controls.endYear.value,
      streetName: this.generateStreetName(),
      geometry: this.projectArea,
      interventionIds: this.interventionsList.map(x => x.id),
      inChargeId: this.form.controls.inChargeId.value
    };
  }

  public setAllowanceToUpsertProject(): void {
    if (this.form.controls.globalBudget.value) {
      const budget: IBudget = {
        allowance: +this.form.controls.globalBudget.value
      };
      Object.assign(this.projectUpsert, { globalBudget: budget });
    } else {
      const budget: IBudget = {
        allowance: this.getInterventionsTotalBudget()
      };
      Object.assign(this.projectUpsert, { globalBudget: budget });
    }
  }
  public async createProject(): Promise<void> {
    if (!this.selectedProject) {
      const project = await this.projectService.createProject(
        this.projectUpsert,
        BroadcastEventException.projectCreate
      );
      this.notificationsService.showSuccess('Le projet a été créé avec succès');
      await this.navigateToProjectOverview(project.id);
    } else {
      if (!isEqual(this.originalProject.interventions, this.interventionsList)) {
        const modalResult = await this.showProjectBudgetWilBeModifiedModal();
        if (modalResult !== ConfirmationModalCloseType.confirmed) {
          return;
        }
      }

      await this.updateProject();
    }
  }
  public async submit(): Promise<void> {
    this.submitting = true;

    try {
      if (!this.isNonGeolocatedProject && !this.doesGeometryContainInterventions(this.projectArea)) {
        await this.showInvalidProjectAreaModal();
        return;
      }

      if (this.didProjectYearRangeChange()) {
        const modalResult = await this.showChangeYearConfirmModal();
        if (modalResult !== ConfirmationModalCloseType.confirmed) {
          return;
        }
      }

      markAllAsTouched(this.form);
      if (this.form.invalid) {
        return;
      }

      this.initUpsertProject();

      if (this.selectedProject?.servicePriorities) {
        if (!this.hasMatchServicePriorities(this.interventionsList)) {
          this.showMatchServicePrioritiesError();
          return;
        }
        this.projectUpsert.servicePriorities = this.selectedProject.servicePriorities;
      }

      this.setAllowanceToUpsertProject();

      if (this.form.controls.category.value) {
        Object.assign(this.projectUpsert, { subCategoryIds: this.form.controls.category.value });
      }

      await this.createProject();
    } finally {
      this.submitting = false;
    }
  }

  public didProjectYearRangeChange(): boolean {
    if (!this.selectedProject) {
      return false;
    }
    return (
      this.selectedProject.startYear !== this.form.controls.startYear.value ||
      this.selectedProject.endYear !== this.form.controls.endYear.value
    );
  }

  private updateInterventionsBudget(): void {
    if (this.isNonGeolocatedProject) {
      return;
    }
    this.interventionsBudget = this.interventionsList.length
      ? sumBy(this.interventionsList, x => x.estimate.allowance)
      : 0;
    this.form.patchValue({ globalBudget: this.interventionsBudget });
  }

  private async updateProject(): Promise<void> {
    await this.projectService.editProject(
      this.selectedProject.id,
      this.projectUpsert,
      BroadcastEventException.projectUpdate
    );
    this.notificationsService.showSuccess('Le projet a été mis à jour avec succès');

    await this.navigateToProjectOverview();
  }

  public getInterventionsTotalBudget(): number {
    let sum = 0;
    this.interventionsList.forEach(x => {
      sum += x.estimate.allowance;
    });
    return Math.ceil(sum);
  }

  public projectHasCategories(project: IEnrichedProject): boolean {
    return !!project?.annualDistribution.annualPeriods.map(p => p.categoryId)?.length;
  }

  public editProjectArea(): void {
    this.currentGeometryEdit = {
      ...(this.workAreaService.simplify(this.projectArea) as Geometry)
    };
    this.map.toolService.startGeometryEditor(this.currentGeometryEdit as any, geometry =>
      this.onGeometryEditorDone(geometry)
    );
    this.map.popupsEnabled = false;
    this.geometryEditorActivated = true;
  }

  public geometryEditorSave(): void {
    this.map.toolService.currentTool.done();
  }

  private async onGeometryEditorDone(geometry: IGeometry): Promise<void> {
    this.currentGeometryEdit = geometry as Geometry;
    if (this.currentGeometryEdit) {
      const isGeometryValid = this.mapService.isGeometryValid(this.currentGeometryEdit as IGeometry);
      if (!this.doesGeometryContainInterventions(this.currentGeometryEdit as IGeometry)) {
        await this.showInvalidProjectAreaModal();
      } else if (isGeometryValid) {
        this.projectArea = { ...(this.currentGeometryEdit as IGeometry) };
        this.refreshProjectAreaDisplay();
      } else {
        this.notificationsService.showWarning('La zone de projet est incorrecte, les points ne doivent pas se croiser');
      }
      this.cancelGeometryEdition();
    }
  }

  private doesGeometryContainInterventions(geometry: IGeometry): boolean {
    return (
      this.interventionsList?.length &&
      this.spatialAnalysisService.geometryContains(
        geometry,
        this.interventionsList.map(i => i.interventionArea.geometry)
      )
    );
  }

  private async showChangeYearConfirmModal(): Promise<any> {
    const title = 'Modification du projet';
    const alertTitle = 'Attention!';
    const message =
      'La modification de la date de fin ne changera pas le statut du projet. Êtes-vous certain de vouloir continuer? ';
    const cancelLabel = 'Annuler';
    const confirmLabel = 'Modifier';

    const modalRef = this.dialogsService.showAlertModal(
      title,
      message,
      cancelLabel,
      alertTitle,
      AlertType.warning,
      confirmLabel
    );

    return modalRef.result;
  }

  private async showProjectBudgetWilBeModifiedModal(): Promise<any> {
    const title = 'Modification de la composition du projet';
    const message =
      'La modification de la composition de ce projet a affecté son budget total. Veuillez modifier sa répartition sur les différentes périodes annuelles';
    const cancelLabel = 'Annuler';
    const alertTitle = 'Attention!';
    const confirmLabel = 'Gérer les périodes anuelles';

    const modalRef = this.dialogsService.showAlertModal(
      title,
      message,
      cancelLabel,
      alertTitle,
      AlertType.warning,
      confirmLabel
    );

    return modalRef.result;
  }

  private async showInvalidProjectAreaModal(): Promise<void> {
    const title = 'Modification de la zone de projet';
    const errorMessage =
      'Le périmètre du projet ne couvre pas toutes ses interventions intégrées/regroupées. Veuillez modifier votre périmètre ou bien retirer une ou plusieurs interventions qui sont hors périmètre.';
    const buttonLabel = 'Modifier le projet';
    const modalRef = this.dialogsService.showAlertModal(title, errorMessage, buttonLabel);
    await modalRef.result;
  }

  public cancelGeometryEdition(): void {
    this.map.popupsEnabled = true;
    this.geometryEditorActivated = false;
    this.map.toolService.stopTools();
    this.mapService.map.interactionMode = 'click-selection';
  }

  /**
   * Receives two lists of IEnrichedIntervention
   * Will remove the element(s) on the second list based on id that are present on the first list
   * Will return a single list
   * which is the concatenation of both lists as:
   * [... list1, ...modifiedList2]
   */
  private interventionsUnion(first: IEnrichedIntervention[], second: IEnrichedIntervention[]): IEnrichedIntervention[] {
    const result = [...first];
    for (const secondItem of second) {
      if (result.some(i => i.id === secondItem.id)) {
        continue;
      }
      result.push(secondItem);
    }
    return result;
  }

  private refreshProjectAreaDisplay(): void {
    if (!this.projectArea) {
      this.map.sourceService.clearProjectSources();
      return;
    }
    const project: IEnrichedProject = {
      id: this.selectedProject?.id,
      startYear: this.currentStartYear,
      endYear: this.currentEndYear,
      geometry: this.projectArea,
      status: this.selectedProject?.status
    };
    this.map.sourceService.setProjectsSources([project]);
    void this.map.highlightService.clearHighlight();
  }

  private async updateFromProject(projectId: string): Promise<void> {
    this.selectedProject = await this.projectService.getProject(projectId, [ProjectExpand.interventions]);
    this.canInteract = this.projectService.canInteract(this.selectedProject);
    this.originalProject = cloneDeep(this.selectedProject);
    if (this.selectedProject.geometry) {
      this.projectArea = this.selectedProject.geometry;
      this.refreshProjectAreaDisplay();
      this.mapService.fitZoomToGeometry(this.selectedProject.geometry);
    } else {
      this.initNonGeolocatedProjectUpdate();
    }
    const [projectType, executor, boroughs] = await zip(
      this.taxonomiesService.code(TaxonomyGroup.projectType, this.selectedProject.projectTypeId).pipe(take(1)),
      this.taxonomiesService.code(TaxonomyGroup.executor, this.selectedProject.executorId).pipe(take(1)),
      this.taxonomiesService.code(TaxonomyGroup.borough, this.selectedProject.boroughId).pipe(take(1))
    ).toPromise();

    this.form.reset({
      projectType,
      geolocated: this.isGeolocated(this.selectedProject as IPlainProject),
      executor: executor.code,
      category: this.selectedProject.subCategoryIds,
      startYear: this.selectedProject.startYear,
      endYear: this.selectedProject.endYear,
      inChargeId: this.selectedProject.inChargeId,
      boroughs,
      budgetClass: this.selectedProject.projectTypeId === ProjectType.other ? null : undefined,
      projectName: this.selectedProject.projectName || undefined,
      globalBudget: this.selectedProject.globalBudget.allowance
    });
    this.form.controls.startYear.disable();
    this.projectArea = this.selectedProject.geometry;

    this.interventionsListSubject.next(this.selectedProject.interventions);
    this.updateInterventionsBudget();
  }

  private initNonGeolocatedProjectCreation(): void {
    this.initNonGeolocatedProjectCommon();

    const currentYear = this.currentYear;
    this.form.reset({
      projectType: this.taxos.projectTypes[0],
      startYear: currentYear,
      endYear: currentYear
    });
  }

  private initNonGeolocatedProjectUpdate(): void {
    this.initNonGeolocatedProjectCommon();

    this.form.controls.projectType.disable();
    this.form.controls.projectName.setValidators(null);
  }

  private initNonGeolocatedProjectCommon(): void {
    this.isNonGeolocatedProject = true;
    this.taxos.projectTypes = this.taxos.projectTypes.filter(p => p.code === ProjectType.other);
    this.form.controls.projectName.clearValidators();
    this.form.controls.projectName.updateValueAndValidity();
    this.form.controls.globalBudget.setValidators([Validators.required]);
    this.form.controls.globalBudget.updateValueAndValidity();
    this.mapService.setZoom(0);
  }

  private setExecutor(): void {
    this.interventionsList$.pipe(takeUntil(this.destroy$)).subscribe(interventions => {
      if (interventions.length) {
        this.form.controls.executor.setValue(this.interventionsList[0].executorId);
        this.form.controls.executor.disable();
      }
    });
  }

  private isGeolocated(project: IPlainProject): { value: boolean; disabled: boolean } {
    if (!project) {
      return undefined;
    }
    if (project.projectTypeId === (ProjectType.integrated || ProjectType.nonIntegrated)) {
      return { value: true, disabled: true };
    }
    if (project.projectTypeId === ProjectType.other) {
      if (project.geometry) {
        return { value: true, disabled: false };
      }
      return { value: false, disabled: false };
    }
    return undefined;
  }

  private hasMatchServicePriorities(interventions: IEnrichedIntervention[]): boolean {
    if (!this.selectedProject?.servicePriorities) {
      return true;
    }
    const requestors = interventions.map(intervention => intervention.requestorId);
    const services = this.selectedProject.servicePriorities.map(servicePriority => servicePriority.service);
    const filteredServicesTaxonomyCodes = this.taxos.services
      .filter(service => service.properties.requestors.some((requestor: string) => requestors.includes(requestor)))
      .map(service => service.code);
    return services.every(service => filteredServicesTaxonomyCodes.includes(service));
  }

  private showMatchServicePrioritiesError(): void {
    this.notificationsService.showError(
      `Il est impossible de retirer l'intervention car le requérant est requis pour les priorités de service du projet`
    );
  }

  private navigateToProjectOverview(projectId?: string): Promise<boolean> {
    return this.router.navigateByUrl(`/window/projects/${projectId || this.selectedProject.id}/overview`);
  }

  private initMapAssets(): void {
    void this.map.hoverService.init(this.map.map);
    combineLatest(this.interventions, this.mapService.mapLoaded$)
      .pipe(
        map(([selectedInterventions]) =>
          selectedInterventions
            .map(interventions => interventions.intervention)
            .filter(intervention => this.inInterventionList(intervention.id))
        ),
        map(interventions => this.assetService.getAssetGroupsFromInterventions(interventions))
      )
      .subscribe(assetGroups => {
        this.mapService.resetAssetLayers();
        this.mapService.showAssetGroups(assetGroups);
        this.mapService.moveAssetGroupLayers(AREA_LAYER_IDS, assetGroups);
      });

    this.interventionList?.interventionHoverEvent
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (intervention: ISelectedIntervention) => {
        await this.map.hoverService.clearHoverAsset();
        if (intervention?.assets.length && this.inInterventionList(intervention.intervention.id)) {
          intervention.assets.forEach(asset => this.map.hoverService.hover(asset.asset, true));
        }
      });

    combineLatest(this.interventions, this.map.hoverService.hoveredAssetFeatures$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async ([interventions, features]) => {
        await this.map.hoverService.clearHoverAsset();

        this.hoveredInterventions.forEach(item => {
          this.interventionList.highlightIntervention(item.intervention.id, false);
        });
        this.hoveredInterventions = [];

        features.forEach(async feature => {
          const assetTypeId = await this.assetService.getAssetTypeAndIdFromAssetFeature(feature);
          const intervention = interventions.find(item =>
            item.assets.find(asset => asset.assetId?.toString() === assetTypeId.assetId?.toString())
          );

          if (intervention) {
            if (intervention.assets.length) {
              intervention.assets.forEach(asset => this.map.hoverService.hover(asset.asset, true));
            }

            this.hoveredInterventions.push(intervention);
            this.interventionList.highlightIntervention(intervention.intervention.id, true);
          }
        });
      });
  }
}
