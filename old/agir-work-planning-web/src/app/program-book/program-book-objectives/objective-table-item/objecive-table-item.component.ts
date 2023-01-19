import { Component, Input, OnInit } from '@angular/core';
import { IEnrichedObjective } from '@villemontreal/agir-work-planning-lib/dist/src';
import { BaseComponent } from 'src/app/shared/components/base/base.component';

@Component({
  selector: 'app-objective-table-item',
  templateUrl: './objective-table-item.component.html',
  styleUrls: ['./objective-table-item.component.scss']
})
export class ObjectiveTableItemComponent extends BaseComponent implements OnInit {
  @Input() public performanceIndicators: IEnrichedObjective[];
  @Input() public targetObjective: IEnrichedObjective;

  public opened = false;
  public progressBarHeight = '8px';

  constructor() {
    super();
  }

  public ngOnInit(): void {
    this.performanceIndicators.map(pi => {
      if (!pi.assetTypeIds?.length) {
        pi.assetTypeIds = null;
      }
      if (!pi.workTypeIds?.length) {
        pi.workTypeIds = null;
      }
      return pi;
    });
  }
}
