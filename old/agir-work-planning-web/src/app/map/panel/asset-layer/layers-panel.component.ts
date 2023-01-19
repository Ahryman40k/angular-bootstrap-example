import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { get, includes, isEmpty } from 'lodash';
import { debounceTime, skipWhile, take } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { GLOBAL_LAYER_DEBOUNCE, GlobalLayerService } from 'src/app/shared/services/global-layer.service';

import { IFilterItem } from '../filters/filter-item-layout/filter-item-layout.component';
import { ILayer, ILayerGroup, ILayerSubGroup } from './map-layer-manager-config';

@Component({
  selector: 'app-layers-panel',
  templateUrl: './layers-panel.component.html'
})
export class LayersPanelComponent extends BaseComponent implements OnInit {
  public form: FormGroup = new FormGroup({});
  public group: ILayerGroup;
  public collapsedIndexes: number[] = [];
  public subGroupLayerItems: { [key: string]: IFilterItem[] } = {};
  private readonly currentLayer: string;

  constructor(
    private readonly fb: FormBuilder,
    private readonly globalLayerService: GlobalLayerService,
    private readonly route: ActivatedRoute
  ) {
    super();
    this.currentLayer = this.route.snapshot.routeConfig.path;
  }

  public async ngOnInit(): Promise<void> {
    super.ngOnInit();
    this.group = this.globalLayerService.getLayerGroupById(this.currentLayer);
    this.subGroupLayerItems = this.createLayerItems(this.group.subGroups);
    await this.initForm(this.group.subGroups);
    this.initLayersVisibility(this.group.subGroups);
  }

  public createLayerItems(subGroups: ILayerSubGroup[]): { [key: string]: IFilterItem[] } {
    let layerItems: IFilterItem[] = [];
    const subGroupLayerItems: { [key: string]: IFilterItem[] } = {};

    subGroups.forEach(subGroup => {
      for (const layer of subGroup.layers) {
        layerItems.push(this.getItemFromLayer(layer));
        subGroupLayerItems[subGroup.subGroupId] = layerItems;
      }
      layerItems = [];
    });
    return subGroupLayerItems;
  }

  private getItemFromLayer(layer: ILayer): IFilterItem {
    return {
      icon: get(layer, 'icon'),
      label: get(layer, 'layerName'),
      selected: layer.isVisible,
      value: layer.layerId,
      subItems: layer.nestedLayers?.map(nestedLayer => this.getItemFromLayer(nestedLayer))
    };
  }

  private async initForm(subGroups: ILayerSubGroup[]): Promise<void> {
    subGroups.forEach((subGroup: ILayerSubGroup) => {
      const control: FormControl = this.fb.control(this.globalLayerService.layer[subGroup.subGroupId]);
      control.valueChanges.pipe(debounceTime(GLOBAL_LAYER_DEBOUNCE)).subscribe(controlValue => {
        this.globalLayerService.patch({ [subGroup.subGroupId]: controlValue });
      });
      this.form.addControl(subGroup.subGroupId, control);
    });

    const updatedInitialFormValues = await this.globalLayerService.layer$.pipe(take(1)).toPromise();

    if (!isEmpty(updatedInitialFormValues)) {
      this.form.patchValue(updatedInitialFormValues);
    }
  }

  private initLayersVisibility(subGroups: ILayerSubGroup[]): void {
    subGroups.forEach((subGroup: ILayerSubGroup) => {
      this.form.controls[subGroup.subGroupId].valueChanges.subscribe(val => {
        this.globalLayerService.setLayersVisibility(subGroup.subGroupId, val);
      });
    });
  }

  public isIndexCollapsed(index: number): boolean {
    return includes(this.collapsedIndexes, index);
  }

  public toggleIndexCollapse(index: number): void {
    if (this.isIndexCollapsed(index)) {
      this.collapsedIndexes = this.collapsedIndexes.filter(x => x !== index);
    } else {
      this.collapsedIndexes.push(index);
    }
  }
}
