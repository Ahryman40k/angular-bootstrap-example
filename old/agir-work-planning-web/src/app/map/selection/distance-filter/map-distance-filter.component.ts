import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';
import { MapService } from 'src/app/shared/services/map.service';

import { MapLogicLayer } from '../../config/layers/logic-layers/map-logic-layer-enum';

@Component({
  selector: 'app-map-distance-filter',
  templateUrl: './map-distance-filter.component.html',
  styleUrls: ['./map-distance-filter.component.scss']
})
export class MapDistanceFilterComponent extends BaseComponent implements OnInit {
  public form: FormGroup;

  public get distanceEnabled(): boolean {
    return this.globalFilterService.distanceFilter.distanceEnabled;
  }

  constructor(
    private readonly fb: FormBuilder,
    public globalFilterService: GlobalFilterService,
    private readonly mapService: MapService
  ) {
    super();
  }

  public async ngOnInit(): Promise<void> {
    super.ngOnInit();
    this.initForm();
    await this.setRadiusLayerVisibility();
  }

  private initForm(): void {
    this.form = this.fb.group({
      distance: [this.globalFilterService.distanceFilter.distance]
    });

    this.setDistanceControlState();

    this.form.valueChanges.subscribe(x => {
      if (x.distance) {
        this.globalFilterService.patchDistance({
          distance: x.distance
        });
      }
    });
  }

  public async toggleEye(): Promise<void> {
    const newValue = !this.distanceEnabled;
    this.globalFilterService.patchDistance({
      distanceEnabled: newValue
    });
    this.setDistanceControlState();
    await this.setRadiusLayerVisibility();
  }

  private setDistanceControlState(): void {
    if (this.distanceEnabled) {
      this.form.controls.distance.enable();
    } else {
      this.form.controls.distance.disable();
    }
  }

  private async setRadiusLayerVisibility(): Promise<void> {
    await this.mapService.setLayerVisibility([MapLogicLayer.selectionRadius], this.distanceEnabled);
  }
}
