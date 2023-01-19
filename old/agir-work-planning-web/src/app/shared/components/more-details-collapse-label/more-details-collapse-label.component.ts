import { Component, Input } from '@angular/core';

import { BaseComponent } from '../base/base.component';

@Component({
  selector: 'app-more-details-collapse-label',
  templateUrl: './more-details-collapse-label.component.html',
  styleUrls: ['./more-details-collapse-label.component.scss']
})
export class MoreDetailsCollapseLabelComponent extends BaseComponent {
  public showDescription = false;
  @Input() public titleToBottomWhenClicked = false;

  public toggleDescription(): void {
    this.showDescription = !this.showDescription;
  }
}
