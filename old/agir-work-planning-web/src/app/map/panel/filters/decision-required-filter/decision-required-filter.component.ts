import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';

interface IFormValue {
  decisionRequired: string;
}

@Component({
  selector: 'app-budget-filter',
  templateUrl: './decision-required-filter.component.html',
  styleUrls: ['./decision-required-filter.component.scss']
})
export class DecisionRequiredFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;

  constructor(private readonly fb: FormBuilder, private readonly globalFilterService: GlobalFilterService) {
    super();
  }
  public ngOnInit(): void {
    this.initForm();
    this.initFormSubscriptions();
  }

  private initForm(): void {
    this.form = this.fb.group({
      decisionRequired: this.globalFilterService.filter.decisionRequired ?? undefined
    });
  }

  private initFormSubscriptions(): void {
    this.form.valueChanges
      .pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE))
      .subscribe(formValue => this.setDecisionRequired(formValue));
  }

  public setDecisionRequired(decisionRequired: boolean): void {
    this.form.value.decisionRequired = decisionRequired;
    this.globalFilterService.patch({ decisionRequired });
  }
}
