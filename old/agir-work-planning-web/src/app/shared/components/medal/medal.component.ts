import { Component, Input } from '@angular/core';
import { MedalType } from '@villemontreal/agir-work-planning-lib/dist/src';

@Component({
  selector: 'app-medal',
  templateUrl: './medal.component.html',
  styleUrls: ['./medal.component.scss']
})
export class MedalComponent {
  @Input() public count: number;
  @Input() public medalId: MedalType;

  public get isCountShown(): boolean {
    return this.count != null;
  }
}
