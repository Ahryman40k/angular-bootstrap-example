import { Component, Input, OnInit, Optional } from '@angular/core';
import { IRtuProject } from '@villemontreal/agir-work-planning-lib/dist/src';

import { BaseObjectCardComponent } from '../../shared/components/card/base-object-card.component';
import { MapNavigationService } from '../../shared/services/map-navigation.service';

@Component({
  selector: 'app-rtu-project-card',
  templateUrl: './rtu-project-card.component.html'
})
export class RtuProjectCardComponent extends BaseObjectCardComponent implements OnInit {
  @Input() public rtuProject: IRtuProject;

  public get rtuProjectStartYear(): number {
    return new Date(this.rtuProject.dateStart).getFullYear();
  }

  public get rtuProjectEndYear(): number {
    return new Date(this.rtuProject.dateEnd).getFullYear();
  }

  constructor(@Optional() mapNavigationService: MapNavigationService) {
    super(mapNavigationService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
  }

  protected onClick(): void {
    this.navigateToSelection(this.rtuProject);
  }
}
