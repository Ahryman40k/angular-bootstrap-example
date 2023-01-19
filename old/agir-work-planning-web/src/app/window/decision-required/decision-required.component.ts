import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';

@Component({
  selector: 'app-decision-required',
  templateUrl: './decision-required.component.html',
  styleUrls: ['./decision-required.component.scss']
})
export class DecisionRequiredComponent {
  @Output() public onAccept = new EventEmitter();
  @Output() public onRefuse = new EventEmitter();
  @Input() public restrictionItems: IRestrictionItem[] = [];

  public accept(): void {
    this.onAccept.emit();
  }

  public refuse(): void {
    this.onRefuse.emit();
  }
}
