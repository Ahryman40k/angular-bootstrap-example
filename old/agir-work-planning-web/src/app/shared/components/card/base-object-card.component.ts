import { HostBinding, HostListener, Input } from '@angular/core';

import { MapNavigationService } from '../../services/map-navigation.service';
import { BaseComponent } from '../base/base.component';

export abstract class BaseObjectCardComponent extends BaseComponent {
  @HostBinding('class.card-hover')
  @Input()
  public navigationEnabled = false;

  @HostBinding('class.object-card')
  public classObjectCard = true;

  constructor(protected mapNavigationService: MapNavigationService) {
    super();
  }

  @HostListener('click')
  // tslint:disable-next-line: function-name
  public _onClick(): void {
    this.onClick();
  }

  protected abstract onClick(): void;

  protected navigateToSelection(obj: any): void {
    if (!this.navigationEnabled) {
      return;
    }
    void this.mapNavigationService.navigateToSelection(obj);
  }
}
