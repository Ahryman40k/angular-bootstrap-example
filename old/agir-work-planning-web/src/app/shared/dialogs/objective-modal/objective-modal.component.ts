import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IEnrichedObjective,
  IEnrichedProgramBook,
  IPlainObjective,
  ITaxonomy,
  ITaxonomyList,
  ProgramBookObjectiveTargetType,
  ProgramBookObjectiveType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, flatten, groupBy, isEmpty, remove } from 'lodash';
import { Observable } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';

import { BaseComponent } from '../../components/base/base.component';
import { markAllAsTouched } from '../../forms/forms.utils';
import { NotificationsService } from '../../notifications/notifications.service';
import { ObjectiveService } from '../../services/objective.service';
import { TaxonomiesService } from '../../services/taxonomies.service';

const ALL_CODE = 'tous';
const ASSET_TYPES = 'assetTypes';
const WORK_TYPES = 'workTypes';

@Component({
  selector: 'app-objective-modal',
  templateUrl: './objective-modal.component.html',
  styleUrls: ['./objective-modal.component.scss']
})
export class ObjectiveModalComponent extends BaseComponent implements OnInit {
  private readonly defaultTaxonomy: ITaxonomy = {
    group: null,
    code: ALL_CODE,
    label: { fr: 'Tous' }
  };

  public errorMessage = '';
  public form: FormGroup;
  public isSubmitting = false;
  public programBookId: string;
  public title: string;
  public programBook: IEnrichedProgramBook;

  @Input() public objective?: IEnrichedObjective;
  @Input() public buttonLabel: string;

  public assetTypes: ITaxonomy[];
  private _assetTypeTaxonomies: ITaxonomy[];
  public targetTypes$ = this.taxonomiesService.group(TaxonomyGroup.objectiveUnits).pipe(take(1));
  public requestors$ = this.taxonomiesService.group(TaxonomyGroup.requestor).pipe(
    take(1),
    map(requestors => [this.defaultTaxonomy, ...requestors])
  );
  public objectiveTypes$ = this.taxonomiesService.group(TaxonomyGroup.objectiveType).pipe(take(1));
  public workTypes$: Observable<ITaxonomy[]>;
  public workTypes: ITaxonomy[];
  private _workTypeTaxonomies: ITaxonomy[];

  public get isObjectiveBidType(): boolean {
    return this.form.controls.targetType.value === ProgramBookObjectiveTargetType.bid;
  }

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder,
    private readonly objectiveService: ObjectiveService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly notificationsService: NotificationsService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    super();
  }

  public ngOnInit(): void {
    this.initForm();
    this.initFormFromObjective();
    this.initTaxonomies();

    this.form.controls.assetTypes.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (assetTypes: string[]) => {
        this.filterAssetTypesAndWorkTypes();
      });

    this.form.controls.workTypes.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(async (workTypes: string[]) => {
      this.filterAssetTypesAndWorkTypes();
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: [null, Validators.required],
      requestors: this.defaultTaxonomy.code,
      workTypes: [],
      assetTypes: [],
      referenceValue: [null, [Validators.required, Validators.min(1)]],
      targetType: ProgramBookObjectiveTargetType.length,
      objectiveType: ProgramBookObjectiveType.threshold
    });
  }

  private initTaxonomies(): void {
    this.taxonomiesService
      .groups(TaxonomyGroup.assetType, TaxonomyGroup.workType)
      .pipe(take(1))
      .subscribe(([assetTypes, workTypes]) => {
        this._assetTypeTaxonomies = assetTypes;
        this._workTypeTaxonomies = workTypes;

        this.filterAssetTypesAndWorkTypes();
      });
  }

  private filterAssetTypesAndWorkTypes(): void {
    const assetTypes = this.getFormValue('assetTypes');
    const workTypes = this.getFormValue('workTypes');
    const isAllWorkTypeSelected = workTypes?.length === this._workTypeTaxonomies.length;
    const isAllAssetTypeSelected = assetTypes?.length === this._assetTypeTaxonomies.length;

    // Define taxonomies into dropdowns
    this.assetTypes = this.filterAssetTypeTaxonomies(assetTypes, isAllWorkTypeSelected);
    this.workTypes = this.filterWorkTypeTaxonomies(workTypes, isAllAssetTypeSelected);

    // Update taxonomy values in the dropdowns
    this.changeDetectorRef.detectChanges();

    this.setFormValue(workTypes, WORK_TYPES, isAllWorkTypeSelected);
    this.setFormValue(assetTypes, ASSET_TYPES, isAllAssetTypeSelected);

    // Update the display with the new values
    this.changeDetectorRef.markForCheck();
  }

  private filterWorkTypeTaxonomies(workTypes: string[], isAllAssetTypeSelected: boolean): ITaxonomyList {
    let workTypeTaxonomies: ITaxonomyList = [];
    const allTaxonomiesLength = this._workTypeTaxonomies.length;
    const isAllSelected = isAllAssetTypeSelected || allTaxonomiesLength === workTypes?.length;
    if (isAllSelected || isEmpty(workTypes) || (workTypes.length === 1 && workTypes[0].toLowerCase() === ALL_CODE)) {
      workTypeTaxonomies.push(this.defaultTaxonomy);
    }
    if (
      isAllSelected ||
      isEmpty(this.form.controls.assetTypes.value) ||
      this.form.controls.assetTypes.value?.every(wt => wt === ALL_CODE)
    ) {
      workTypeTaxonomies.push(...this._workTypeTaxonomies);
      return workTypeTaxonomies;
    }

    if (this.form.controls.assetTypes.value?.includes(ALL_CODE)) {
      workTypeTaxonomies = isEmpty(this.form.controls.workTypes.value)
        ? [this.defaultTaxonomy, ...this._workTypeTaxonomies]
        : this._workTypeTaxonomies;
      return workTypeTaxonomies;
    }

    // Filter the rest of the workTypes to match the assetTypes
    const tempWorkTypes: ITaxonomyList = this.filterWorkTypesByAssetTypes(this.form.controls.assetTypes.value);

    const groupedWorkTypes = groupBy(flatten(tempWorkTypes), t => t.code);
    // find the code which is include in every assetType
    for (const key of Object.keys(groupedWorkTypes)) {
      if (groupedWorkTypes[key].length === this.form.controls.assetTypes.value?.length) {
        workTypeTaxonomies.push(groupedWorkTypes[key].find(x => x));
      }
    }

    return workTypeTaxonomies;
  }

  private filterAssetTypeTaxonomies(assetTypes: string[], isAllWorkTypeSelected: boolean): ITaxonomyList {
    let assetTypeTaxonomies: ITaxonomyList = [];

    const allTaxonomiesLength = this._assetTypeTaxonomies.length;
    const isAllSelected = isAllWorkTypeSelected || allTaxonomiesLength === assetTypes?.length;
    if (isAllSelected || isEmpty(assetTypes) || (assetTypes.length === 1 && assetTypes[0].toLowerCase() === ALL_CODE)) {
      assetTypeTaxonomies.push(this.defaultTaxonomy);
    }
    if (
      isAllSelected ||
      isEmpty(this.form.controls.workTypes.value) ||
      this.form.controls.workTypes.value.some(wt => wt === ALL_CODE)
    ) {
      assetTypeTaxonomies.push(...this._assetTypeTaxonomies);
      return assetTypeTaxonomies;
    }

    // Filter the rest of the assetTypes to match the workTypes
    this._assetTypeTaxonomies.forEach(at => {
      if (this.form.controls.workTypes.value?.every(wt => at.properties?.workTypes?.includes(wt))) {
        assetTypeTaxonomies.push(at);
      }
    });

    if (this.form.controls.workTypes.value?.includes(ALL_CODE)) {
      assetTypeTaxonomies = isEmpty(this.form.controls.assetTypes.value)
        ? [this.defaultTaxonomy, ...this._assetTypeTaxonomies]
        : this._assetTypeTaxonomies;
    }

    return assetTypeTaxonomies;
  }

  private filterWorkTypesByAssetTypes(assetTypeIds: string[]): ITaxonomyList {
    if (isEmpty(assetTypeIds)) {
      return null;
    }
    const taxonomyList: ITaxonomyList = [];
    assetTypeIds?.forEach(assetTypeId => {
      const assetTypeTaxo = this._assetTypeTaxonomies.find(at => at.code === assetTypeId);
      taxonomyList.push(
        ...this._workTypeTaxonomies.filter(wt => assetTypeTaxo?.properties?.workTypes?.includes(wt.code))
      );
    });
    return taxonomyList;
  }

  /**
   * Remove default taxonomies on the reference
   * @param taxonomies
   */
  private removeDefaultTaxonomy(taxonomies: string[]): void {
    remove(taxonomies, taxonomy => taxonomy === this.defaultTaxonomy.code);
  }

  private setFormValue(incomingTaxonomies: string[], formControlName: string, isAllCode: boolean): void {
    let taxonomies: string[];
    if (isAllCode) {
      taxonomies = [ALL_CODE];
    } else if (!isEmpty(incomingTaxonomies)) {
      taxonomies = incomingTaxonomies;
    } else {
      taxonomies = this.form.controls[formControlName].value;
    }
    this.form.controls[formControlName].patchValue(taxonomies, { emitEvent: false });
  }

  private getFormValue(formControlName: string): string[] {
    const formValues = cloneDeep(this.form.controls[formControlName].value);
    if (formValues && formValues.length > 1 && formValues.includes(this.defaultTaxonomy.code)) {
      this.removeDefaultTaxonomy(formValues);
    }
    return formValues?.filter(x => x);
  }

  private initFormFromObjective(): void {
    if (!this.objective) {
      return;
    }

    this.form.reset({
      name: this.objective.name,
      assetTypes: this.objective.assetTypeIds,
      requestors: this.objective.requestorId || this.defaultTaxonomy.code,
      workTypes: this.objective.workTypeIds,
      referenceValue: this.objective.values.reference,
      targetType: this.objective.targetType,
      objectiveType: this.objective.objectiveType
    });
  }

  public cancel(): void {
    this.activeModal.close(false);
  }

  public toggleObjectiveTargetType(): void {
    let targetType = this.form.controls.targetType.value;
    if (targetType !== ProgramBookObjectiveTargetType.bid) {
      targetType = ProgramBookObjectiveTargetType.bid;
    } else {
      targetType = ProgramBookObjectiveTargetType.length;
    }
    this.form.patchValue({ targetType });
    this.handleFormState();
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }
    this.isSubmitting = true;
    try {
      const referenceValue = await this.getReferenceValue();
      const plainObjective = this.createPlainObjective(referenceValue);
      if (this.objective) {
        await this.objectiveService.update(this.programBookId, plainObjective, this.objective.id);
        this.notificationsService.showSuccess('Objectif modifié avec succès');
      } else {
        await this.objectiveService.create(this.programBookId, plainObjective);
        this.notificationsService.showSuccess('Objectif créé avec succès');
      }
      this.outdatePriorityScenarios(plainObjective);
      this.activeModal.close('submit');
    } finally {
      this.isSubmitting = false;
    }
  }

  private outdatePriorityScenarios(plainObjective: IPlainObjective): void {
    if (plainObjective.objectiveType !== ProgramBookObjectiveType.threshold) {
      return;
    }
    this.programBook.priorityScenarios = this.programBook.priorityScenarios.map(ps => {
      ps.isOutdated = true;
      return ps;
    });
  }

  private createPlainObjective(referenceValue: string): IPlainObjective {
    const objective = {
      name: this.form.value.name,
      targetType: this.form.value.targetType || ProgramBookObjectiveTargetType.length,
      objectiveType: this.form.value.objectiveType || ProgramBookObjectiveType.threshold,
      requestorId: this.form.value.requestors === this.defaultTaxonomy.code ? null : this.form.value.requestors,
      assetTypeIds: this.form.value.assetTypes?.includes(this.defaultTaxonomy.code) ? null : this.form.value.assetTypes,
      workTypeIds: this.form.value.workTypes?.includes(this.defaultTaxonomy.code) ? null : this.form.value.workTypes,
      referenceValue: Number(referenceValue)
    };
    return objective;
  }

  private async getReferenceValue(): Promise<string> {
    return this.form.controls.referenceValue?.value;
  }

  private handleFormState(): void {
    this.form.patchValue({ targetType: ProgramBookObjectiveTargetType.length });
    this.form.controls.requestors.enable();
    this.form.controls.workTypes.enable();
    this.form.controls.assetTypes.enable();
    this.form.controls.referenceValue.enable();
    this.form.controls.targetType.enable();
  }
}
