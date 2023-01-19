import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { values } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import {
  ComparisonService,
  CriteriaType,
  defaultCriteriaType,
  ICriteriaItem,
  ICriteriaValue
} from 'src/app/shared/services/comparison.service';
import { enumValues } from 'src/app/shared/utils/utils';

import { criteriaColor } from '../../config/layers/styles';

const MAX_CRITERIA_VALUE = 5;
const MIN_CRITERIA_VALUE = 1;
const criteriaColors = values(criteriaColor);

@Component({
  selector: 'app-comparison-panel',
  templateUrl: './comparison-panel.component.html',
  styleUrls: ['./comparison-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComparisonPanelComponent extends BaseComponent implements OnInit, OnDestroy, AfterViewInit {
  public criteriaTypeItems: CriteriaType[] = enumValues<CriteriaType>(CriteriaType);

  public criteriaForm: FormGroup;

  private initialised = false;

  constructor(private readonly comparisonService: ComparisonService, private readonly fb: FormBuilder) {
    super();
  }

  public ngOnInit(): void {
    this.initForm();
  }

  public ngAfterViewInit(): void {
    this.initialised = true;
  }

  public initForm(): void {
    this.criteriaForm = this.fb.group({
      criteriaType: new FormControl(this.comparisonService.criteriaValues.type, Validators.required),
      criteriaValues: this.fb.array(this.comparisonService.criteriaValues.items.map(el => el.value))
    });
    this.comparisonService.loadCriteriaValues(this.criteriaType);
    this.criteriaTypeCtrl.valueChanges.subscribe((type: CriteriaType) => {
      this.resetCriteriaValues();
      this.comparisonService.loadCriteriaValues(type);
    });
    this.criteriaValuesCtrl.valueChanges.subscribe(arg => {
      const criteriaValue: ICriteriaValue = {
        type: this.criteriaType,
        items: this.criteriaValues.map((el, index) => {
          return { value: el, color: criteriaColors[index], index };
        })
      };
      this.comparisonService.patchCriteriaValue(criteriaValue);
    });
  }

  public pushCriteriaValue(): void {
    this.criteriaValuesCtrl.push(new FormControl(''));
  }

  public removeCriteriaValue(index): void {
    this.criteriaValuesCtrl.removeAt(index);
  }

  public get criteriaTypeCtrl(): FormControl {
    return this.criteriaForm.get('criteriaType') as FormControl;
  }

  public get criteriaValuesCtrl(): FormArray {
    return this.criteriaForm.get('criteriaValues') as FormArray;
  }

  public get criteriaValues(): string[] {
    return this.criteriaValuesCtrl.value;
  }

  public get criteriaType(): CriteriaType {
    return this.criteriaTypeCtrl.value;
  }

  get criteriaValueItems$(): Observable<ICriteriaItem[]> {
    return this.comparisonService.allCriteriaValues$.pipe(
      map(cr => {
        const criteriaType = cr.find(el => el.type === this.criteriaType);
        if (!this.initialised) {
          return criteriaType ? criteriaType.items : [];
        }
        return criteriaType ? criteriaType.items.filter(item => this.criteriaValues.indexOf(item.value) === -1) : [];
      })
    );
  }

  get canPushCriteriaValue(): boolean {
    return this.criteriaValuesCtrl.length < MAX_CRITERIA_VALUE;
  }

  get canRemoveCriteriaValue(): boolean {
    return this.criteriaValuesCtrl.length > MIN_CRITERIA_VALUE;
  }

  public criteriaColor(index: number): string {
    return criteriaColors[index];
  }

  public resetCriteria(): void {
    this.criteriaTypeCtrl.setValue(defaultCriteriaType);
  }

  public resetCriteriaValues(): void {
    while (this.criteriaValuesCtrl.length > 0) {
      this.criteriaValuesCtrl.removeAt(0);
    }
    this.pushCriteriaValue();
  }
}
