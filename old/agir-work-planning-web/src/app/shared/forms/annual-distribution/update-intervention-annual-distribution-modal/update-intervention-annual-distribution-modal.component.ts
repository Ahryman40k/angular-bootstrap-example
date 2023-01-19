import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  IEnrichedIntervention,
  IInterventionAnnualDistribution,
  IInterventionAnnualPeriod
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { AnnualDistributionService } from 'src/app/shared/services/annual-distribution.service';

import { markAllAsTouched } from '../../forms.utils';

@Component({
  selector: 'app-update-intervention-annual-distribution-modal',
  templateUrl: './update-intervention-annual-distribution-modal.component.html',
  styleUrls: ['./update-intervention-annual-distribution-modal.component.scss']
})
export class UpdateInterventionAnnualDistributionModalComponent extends BaseComponent implements OnInit {
  public form: FormGroup;
  public intervention: IEnrichedIntervention;
  public isSubmitting = false;
  public isSameAccountIdControl = new FormControl();
  public isSameAccountId: boolean = this.isSameAccountIdControl.value;
  public sameAccountIdControl = new FormControl();
  public totalAllowance = 0;

  public placeholder = 'En milliers de dollars : (0,000)';
  public precision = 3;

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder,
    private readonly annualDistributionService: AnnualDistributionService,
    private readonly notificationsService: NotificationsService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.initForm();
    this.initSameAccountIdControl();
    this.updateTotalAllowance();
  }

  public cancel(): void {
    this.activeModal.close(false);
  }

  public setAllowance(event: number, year: number): void {
    this.form.value[year].allowance = isNaN(event) ? 0 : event;
    this.updateTotalAllowance();
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }
    this.isSubmitting = true;

    try {
      const annualPeriods = this.intervention.annualDistribution.annualPeriods;
      this.updateAnnualPeriods(annualPeriods);

      const plainAnnualDistribution: IInterventionAnnualDistribution = {
        annualPeriods,
        distributionSummary: {
          note: this.form.value.notes || null
        }
      };
      await this.annualDistributionService.updateInterventionAnnualDistribution(
        this.intervention.id,
        plainAnnualDistribution
      );
      this.notificationsService.showSuccess("Données de l'intervention modifiées avec succès");
      this.activeModal.close(true);
    } finally {
      this.isSubmitting = false;
    }
  }

  private updateAnnualPeriods(annualPeriods: IInterventionAnnualPeriod[]): void {
    for (const period of annualPeriods) {
      period.annualAllowance = this.form.value[period.year].allowance;
      period.accountId = this.isSameAccountId
        ? this.sameAccountIdControl.value
        : this.form.value[period.year].accountId;
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      notes: [this.intervention.annualDistribution.distributionSummary?.note || null, Validators.maxLength(250)]
    });
    for (const period of this.intervention.annualDistribution.annualPeriods) {
      this.form.addControl(period.year.toString(), this.createItem(period));
    }

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateTotalAllowance();
    });
  }

  private initSameAccountIdControl(): void {
    this.isSameAccountIdControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.isSameAccountId = value;
    });
  }

  private createItem(period: IInterventionAnnualPeriod): FormGroup {
    return this.fb.group({
      allowance: period.annualAllowance,
      accountId: period.accountId
    });
  }

  private updateTotalAllowance(): void {
    this.totalAllowance = 0;
    for (const period of this.intervention.annualDistribution.annualPeriods) {
      const allowance = this.form.value[period.year].allowance;
      if (allowance) {
        this.totalAllowance = this.totalAllowance + allowance;
      }
    }
  }
}
