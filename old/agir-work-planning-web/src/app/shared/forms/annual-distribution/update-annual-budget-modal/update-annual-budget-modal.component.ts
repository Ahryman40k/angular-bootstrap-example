import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { AnnualDistributionService } from 'src/app/shared/services/annual-distribution.service';

import { markAllAsTouched } from '../../forms.utils';

@Component({
  selector: 'app-update-annual-budget-modal',
  templateUrl: './update-annual-budget-modal.component.html',
  styleUrls: ['./update-annual-budget-modal.component.scss']
})
export class UpdateAnnualBudgetModalComponent implements OnInit {
  public form: FormGroup;
  public project: IEnrichedProject;
  public isSubmitting = false;
  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly fb: FormBuilder,
    private readonly annualDistributionService: AnnualDistributionService,
    private readonly notificationsService: NotificationsService
  ) {}

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
      const plainAnnualDistribution = {
        annualProjectDistributionSummary: { totalAnnualBudgetNote: this.form.value.notes }
      };
      await this.annualDistributionService.updateProjectAnnualDistribution(this.project.id, plainAnnualDistribution);
      this.notificationsService.showSuccess('Budget annuel modifié avec succès');
      this.activeModal.close(true);
    } finally {
      this.isSubmitting = false;
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      notes: this.project.annualDistribution.distributionSummary?.totalAnnualBudget?.note || null
    });
  }
}
