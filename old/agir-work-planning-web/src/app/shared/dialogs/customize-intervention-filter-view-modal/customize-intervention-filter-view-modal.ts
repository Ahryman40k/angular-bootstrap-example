import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ErrorCodes, InterventionDecisionType, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib';
import { cloneDeep, concat } from 'lodash';
import { map, take, takeUntil } from 'rxjs/operators';
import { BaseComponent } from '../../components/base/base.component';
import { markAllAsTouched } from '../../forms/forms.utils';
import { AssetService } from '../../services/asset.service';
import { TaxonomiesService } from '../../services/taxonomies.service';
import { UserService } from '../../user/user.service';
import { CustomValidators } from '../../validators/custom-validators';
@Component({
  selector: 'app-customize-intervention-filter-view-modal',
  templateUrl: './customize-intervention-filter-view-modal.html',
  styleUrls: ['./customize-intervention-filter-view-modal.scss']
})
export class CustomizeInterventionFilterViewModalComponent extends BaseComponent {
  public form: FormGroup;
  public hasPermission;

  public boroughs$ = this.taxonomiesService.group(TaxonomyGroup.borough).pipe(take(1));
  public interventionTypeId$ = this.taxonomiesService.group(TaxonomyGroup.interventionType).pipe(take(1));
  public status$ = this.taxonomiesService.group(TaxonomyGroup.interventionStatus).pipe(
    map(taxo => {
      if (!this.hasPermission) {
        return taxo;
      }
      const decisionTypeItem: ITaxonomy[] = [
        {
          code: InterventionDecisionType.revisionRequest,
          group: null,
          label: { fr: 'En attente (suite à une révision)' }
        }
      ];
      const waitingStatuses = taxo;

      return concat(waitingStatuses, decisionTypeItem);
    }),
    takeUntil(this.destroy$)
  );
  public requestorId$ = this.taxonomiesService.group(TaxonomyGroup.requestor).pipe(take(1));
  public executorId$ = this.taxonomiesService.group(TaxonomyGroup.executor).pipe(take(1));
  public programId$ = this.taxonomiesService.group(TaxonomyGroup.programType).pipe(take(1));
  public medalId$ = this.taxonomiesService.group(TaxonomyGroup.medalType).pipe(take(1));
  public workTypeId$ = this.taxonomiesService.group(TaxonomyGroup.workType).pipe(take(1));
  public assetTypes$ = this.assetService.getActiveAssets();

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly assetService: AssetService,
    public readonly userService: UserService
  ) {
    super();
  }

  private createForm(): void {
    this.form = this.fb.group({
      fromPlanificationYear: [null, [CustomValidators.min(2000), Validators.max(3000)]],
      toPlanificationYear: [null, [CustomValidators.min(2000), Validators.max(3000)]],
      boroughId: [[]],
      interventionTypeId: [[]],
      status: [[]],
      requestorId: [[]],
      executorId: [[]],
      fromEstimate: [null],
      toEstimate: [null],
      programId: [[]],
      medalId: [[]],
      workTypeId: [[]],
      assetTypeId: [[]],
      decisionRequired: [[]]
    });
    this.form.setValidators([
      CustomValidators.formRange('fromPlanificationYear', 'toPlanificationYear', 'rangePlanificationYear'),
      CustomValidators.formRange('fromEstimate', 'toEstimate', 'rangeBudget')
    ]);
  }

  // tslint:disable-next-line: cyclomatic-complexity
  public initialize(filters, hasPermission): void {
    this.hasPermission = hasPermission;
    this.createForm();
    if (filters) {
      this.form.reset({
        fromPlanificationYear: filters.fromPlanificationYear || null,
        toPlanificationYear: filters.toPlanificationYear || null,
        boroughId: filters.boroughId || [],
        interventionTypeId: filters.interventionTypeId || [],
        status: filters.status || [],
        requestorId: filters.requestorId || [],
        executorId: filters.executorId || [],
        fromEstimate: filters.fromEstimate || null,
        toEstimate: filters.toEstimate || null,
        programId: filters.programId || [],
        medalId: filters.medalId || [],
        workTypeId: filters.workTypeId || [],
        assetTypeId: filters.assetTypeId || [],
        decisionRequired: filters.decisionRequired ?? null
      });
    }
  }

  public saveTableView(): void {
    markAllAsTouched(this.form);
    if (this.form.valid) {
      this.form.value.fromPlanificationYear = this.form.value.fromPlanificationYear
        ? parseInt(this.form.value.fromPlanificationYear, 10)
        : null;
      this.form.value.toPlanificationYear = this.form.value.toPlanificationYear
        ? parseInt(this.form.value.toPlanificationYear, 10)
        : null;
      this.activeModal.close(this.form.value);
    }
  }

  public resetTableView(): void {
    this.form.reset({
      fromPlanificationYear: null,
      toPlanificationYear: null,
      boroughId: [],
      interventionTypeId: [],
      requestorId: [],
      executorId: [],
      fromEstimate: null,
      toEstimate: null,
      programId: [],
      medalId: [],
      workTypeId: [],
      assetTypeId: [],
      decisionRequired: null
    });
  }

  public cancel(): void {
    this.activeModal.close(false);
  }

  public setDecisionRequired(value: boolean): void {
    this.form.get('decisionRequired').setValue(value);
  }
}
