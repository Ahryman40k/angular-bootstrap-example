import { Component } from '@angular/core';
import { ICountBy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { shareReplay, takeUntil } from 'rxjs/operators';
import { BoroughCountFeature } from 'src/app/shared/models/borough/borough-count-feature';

import { BoroughService } from '../../../shared/services/borough.service';
import { BasePopupComponent } from '../base-popup.component';

@Component({
  selector: 'app-borough-count-popup',
  templateUrl: './borough-count-popup.component.html'
})
export class BoroughCountPopupComponent extends BasePopupComponent {
  public projectCount: number;
  public interventionCount: number;
  public boroughId: string;
  public countByMedal$: Observable<ICountBy[]>;

  constructor(private readonly boroughService: BoroughService) {
    super();
  }

  public init(feature: BoroughCountFeature): void {
    this.projectCount = this.getCount(feature.properties.projectCount as string);
    this.interventionCount = this.getCount(feature.properties.interventionCount as string);
    this.boroughId = feature.properties.ABREV;
    this.countByMedal$ = this.boroughService
      .getCountByMedal(this.boroughId)
      .pipe(takeUntil(this.destroy$), shareReplay());
    this.initializedSubject.next();
  }

  private getCount(countJson: string): number {
    return countJson ? JSON.parse(countJson).count : 0;
  }
}
