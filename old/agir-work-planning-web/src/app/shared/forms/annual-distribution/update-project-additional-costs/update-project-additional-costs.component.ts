import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  AdditionalCostType,
  IAdditionalCostsTotalAmount,
  IEnrichedProject,
  IEnrichedProjectAnnualPeriod,
  IPlainProjectAnnualDistribution,
  IPlainProjectAnnualPeriod,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isNull, isUndefined } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { AnnualDistributionService } from 'src/app/shared/services/annual-distribution.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';

import { markAllAsTouched } from '../../forms.utils';

@Component({
  selector: 'app-update-project-additional-costs',
  templateUrl: './update-project-additional-costs.component.html',
  styleUrls: ['./update-project-additional-costs.component.scss']
})
export class UpdateProjectAdditionalCostsComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public project: IEnrichedProject;
  public isSubmitting = false;
  public additionalCostTypeControl = new FormControl(AdditionalCostType.professionalServices);

  public additionalCosts$ = this.taxonomiesService.group(TaxonomyGroup.additionalCost).pipe(takeUntil(this.destroy$));

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder,
    private readonly annualDistributionService: AnnualDistributionService,
    private readonly notificationsService: NotificationsService,
    private readonly taxonomiesService: TaxonomiesService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.initForm();
  }

  public cancel(): void {
    this.activeModal.close(false);
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }
    this.isSubmitting = true;

    try {
      const plainAnnualDistribution = this.createPlainAnnualDistribution();
      await this.annualDistributionService.updateProjectAnnualDistribution(this.project.id, plainAnnualDistribution);
      this.notificationsService.showSuccess('Budget du projet modifié avec succès');
      this.activeModal.close(true);
    } finally {
      this.isSubmitting = false;
    }
  }

  private initForm(): void {
    this.form = this.fb.group({});

    for (const additionalCost of this.project.annualDistribution.distributionSummary.additionalCostTotals) {
      this.form.addControl(additionalCost.type.toString(), this.createAdditionalCostControl(additionalCost));
    }
  }

  private createAdditionalCostControl(additionalCost: IAdditionalCostsTotalAmount): FormGroup {
    const additionalCosts = this.project.annualDistribution.annualPeriods.map(ap =>
      ap.additionalCosts.find(ac => ac.type === additionalCost.type)
    );
    const sameAccountId = additionalCosts.every(a => isNull(a.accountId) || isUndefined(a.accountId))
      ? false
      : additionalCosts.every(ac => ac.accountId === additionalCosts[0].accountId);

    const form = this.fb.group({
      note: [additionalCost.note, [Validators.maxLength(250)]],
      isSameAccountId: sameAccountId,
      sameAccountId: sameAccountId ? additionalCosts[0].accountId : null
    });

    for (const period of this.project.annualDistribution.annualPeriods) {
      form.addControl(period.year.toString(), this.createItem(period, additionalCost));
    }
    return form;
  }

  private createItem(period: IEnrichedProjectAnnualPeriod, additionalCost: IAdditionalCostsTotalAmount): FormGroup {
    const periodAdditionalCost = period.additionalCosts.find(a => a.type === additionalCost.type);
    return this.fb.group({
      allowance: periodAdditionalCost.amount,
      accountId: periodAdditionalCost.accountId
    });
  }

  private createPlainAnnualDistribution(): IPlainProjectAnnualDistribution {
    const annualDistribution: IPlainProjectAnnualDistribution = {
      annualPeriods: [],
      annualProjectDistributionSummary: {
        additionalCostsNotes: []
      }
    };
    for (const period of this.project.annualDistribution.annualPeriods) {
      const annualPeriod: IPlainProjectAnnualPeriod = {
        year: period.year,
        additionalCosts: []
      };
      for (const additionalCost of this.project.annualDistribution.distributionSummary.additionalCostTotals) {
        annualPeriod.additionalCosts.push({
          type: additionalCost.type,
          amount: this.form.value[additionalCost.type][period.year].allowance,
          accountId: this.form.value[additionalCost.type].isSameAccountId
            ? this.form.value[additionalCost.type].sameAccountId
            : this.form.value[additionalCost.type][period.year].accountId
        });
      }
      annualDistribution.annualPeriods.push(annualPeriod);
    }
    for (const additionalCost of this.project.annualDistribution.distributionSummary.additionalCostTotals) {
      annualDistribution.annualProjectDistributionSummary.additionalCostsNotes.push({
        type: additionalCost.type,
        note: this.form.value[additionalCost.type].note
      });
    }
    return annualDistribution;
  }
}
