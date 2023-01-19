import { Component, forwardRef, Input } from '@angular/core';
import { FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  IAsset,
  IEnrichedIntervention,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { FormComponent } from 'src/app/shared/forms/form-component';

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => OpportunityNoticeAssetItemComponent),
  multi: true
};

@Component({
  selector: 'app-opportunity-notice-asset-item',
  templateUrl: './opportunity-notice-asset-item.component.html',
  styleUrls: ['./opportunity-notice-asset-item.component.scss'],
  providers: [valueAccessorProvider]
})
export class OpportunityNoticeAssetItemComponent extends FormComponent<any[]> {
  @Input() public asset: IAsset;
  @Input() public checked: boolean;
  @Input() public workTypes: ITaxonomy[];
  @Input() public workType: string;
  @Input() public form: FormGroup;
  @Input() public isWorkTypeForAllAssetsChecked: boolean;
  @Input() public intervention: IEnrichedIntervention;

  public readonly TAXONOMY_GROUP_INTERVENTION_STATUS = TaxonomyGroup.interventionStatus;
  public readonly TAXONOMY_GROUP_ASSET_TYPE = TaxonomyGroup.assetType;

  public get isChecked(): boolean {
    return !!this.form.controls[this.asset.id].value;
  }

  public get hasToDisplayDropDown(): boolean {
    return this.isChecked && !this.isWorkTypeForAllAssetsChecked;
  }

  public getWorkTypeIdControlName(asset: IAsset): string {
    return `${asset.id}_WorkTypeId`;
  }

  public toggleCheckbox(assetId: string): void {
    this.form.controls[assetId].setValue(!this.form.controls[this.asset.id].value);
  }
}
