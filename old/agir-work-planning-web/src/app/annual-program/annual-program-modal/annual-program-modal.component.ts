import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  AnnualProgramConstant,
  IEnrichedAnnualProgram,
  IPlainAnnualProgram,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { take } from 'rxjs/operators';
import { arrayOfNumbers } from 'src/app/shared/arrays/number-arrays';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { markAllAsTouched } from 'src/app/shared/forms/forms.utils';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { RestrictionType, UserRestrictionsService } from 'src/app/shared/user/user-restrictions.service';

@Component({
  selector: 'app-annual-program-modal',
  templateUrl: './annual-program-modal.component.html',
  styleUrls: ['./annual-program-modal.component.scss']
})
export class AnnualProgramModalComponent extends BaseComponent implements OnInit {
  @Input() public buttonLabel: string;

  public form: FormGroup;
  public yearList: number[];
  public executors: ITaxonomy[];
  public submitting = false;
  public annualProgram: IEnrichedAnnualProgram;
  public title: string;
  public annualProgramContainsProject = false;

  public get isUpdating(): boolean {
    return !!this.annualProgram;
  }

  public get canUpdateExecutorAndYear(): boolean {
    return this.isUpdating && !this.annualProgramContainsProject;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly notificationsService: NotificationsService,
    private readonly annualProgramService: AnnualProgramService,
    private readonly activeModal: NgbActiveModal,
    private readonly userRestrictionsService: UserRestrictionsService
  ) {
    super();
  }

  public async ngOnInit(): Promise<void> {
    if (this.isUpdating) {
      this.annualProgramContainsProject = await this.annualProgramService.annualProgramContainsProjects(
        this.annualProgram.id
      );
    }
    await this.setExecutors();
    this.yearList = arrayOfNumbers(AnnualProgramConstant.minimumYear, AnnualProgramConstant.maximumYear);
    this.createForm();
  }

  public async submit(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }

    this.submitting = true;
    if (this.isUpdating) {
      await this.updateAnnualProgram();
    } else {
      await this.createAnnualProgram();
    }
  }

  private async createAnnualProgram(): Promise<void> {
    const plainAnnualProgram: IPlainAnnualProgram = {
      executorId: this.form.controls.executor.value,
      year: this.form.controls.year.value,
      budgetCap: this.form.controls.budgetCap.value,
      description: this.form.controls.notes.value
    };
    try {
      await this.annualProgramService.create(plainAnnualProgram);
      this.notificationsService.showSuccess('Programmation annuelle créée');
      this.activeModal.close(true);
    } finally {
      this.submitting = false;
    }
  }

  private async updateAnnualProgram(): Promise<void> {
    const plainAnnualProgram: IPlainAnnualProgram = {
      executorId: this.form.controls.executor.value,
      year: this.form.controls.year.value,
      budgetCap: this.form.controls.budgetCap.value,
      description: this.form.controls.notes.value,
      status: this.annualProgram.status
    };
    try {
      await this.annualProgramService.update(this.annualProgram.id, plainAnnualProgram);
      this.notificationsService.showSuccess('Programmation annuelle modifiée');
      this.activeModal.close(true);
    } finally {
      this.submitting = false;
    }
  }

  private createForm(): void {
    this.form = this.fb.group({
      year: [null, Validators.required],
      executor: ['di', Validators.required],
      budgetCap: [null, Validators.required],
      notes: [null]
    });

    if (this.isUpdating) {
      this.form.reset({
        year: this.annualProgram.year,
        executor: this.annualProgram.executorId,
        budgetCap: this.annualProgram.budgetCap,
        notes: this.annualProgram.description
      });
      if (!this.canUpdateExecutorAndYear) {
        this.form.controls.executor.reset({ value: this.annualProgram.executorId, disabled: true });
        this.form.controls.year.reset({ value: this.annualProgram.year, disabled: true });
      }
    }
  }

  public reject(): void {
    this.activeModal.close(false);
  }

  private async setExecutors(): Promise<void> {
    const executors = await this.taxonomiesService
      .group(TaxonomyGroup.executor)
      .pipe(take(1))
      .toPromise();
    this.executors = this.userRestrictionsService.filterTaxonomies(executors, RestrictionType.EXECUTOR);
  }
}
