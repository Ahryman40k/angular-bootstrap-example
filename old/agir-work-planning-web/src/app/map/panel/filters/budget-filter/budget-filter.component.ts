import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { GLOBAL_FILTER_DEBOUNCE, GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';

interface IFormValue {
  budgetFrom: number;
  budgetTo: number;
}

@Component({
  selector: 'app-budget-filter',
  templateUrl: './budget-filter.component.html',
  styleUrls: ['./budget-filter.component.scss']
})
export class BudgetFilterComponent implements OnInit {
  public form: FormGroup;

  constructor(private readonly fb: FormBuilder, private readonly globalFilterService: GlobalFilterService) {}

  public ngOnInit(): void {
    this.initForm();
    this.initFormSubscriptions();
  }

  private initForm(): void {
    this.form = this.fb.group(
      {
        budgetFrom: [this.globalFilterService.filter.budgetFrom],
        budgetTo: [this.globalFilterService.filter.budgetTo]
      },
      { validators: [this.budgetValidator()] }
    );
  }

  private initFormSubscriptions(): void {
    this.form.valueChanges
      .pipe(debounceTime(GLOBAL_FILTER_DEBOUNCE))
      .subscribe(formValue => this.setFilters(formValue));
  }

  private setFilters(formValue: IFormValue): void {
    if (!this.form.valid) {
      return;
    }
    const from = Number.isNaN(formValue.budgetFrom) ? undefined : formValue.budgetFrom;
    const to = Number.isNaN(formValue.budgetTo) ? undefined : formValue.budgetTo;
    this.globalFilterService.patch({ budgetFrom: from, budgetTo: to });
  }

  /**
   * Validates that budgetFrom and budgetTo are valid.
   */
  private budgetValidator(): ValidatorFn {
    return (formGroup: FormGroup): { [key: string]: any } | null => {
      const from = formGroup.value.budgetFrom;
      const to = formGroup.value.budgetTo;
      if (from == null || to == null || from <= to) {
        return null;
      }
      return {
        budget: {
          from,
          to
        }
      };
    };
  }
}
