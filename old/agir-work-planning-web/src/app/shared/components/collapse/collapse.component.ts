import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-collapse',
  templateUrl: './collapse.component.html',
  styleUrls: ['./collapse.component.scss']
})
export class CollapseComponent {
  @Input() public title: string;
  public collapsed: boolean = true;

  public click(): void {
    this.collapsed = !this.collapsed;
  }

  public open(): void {
    this.collapsed = false;
  }
}
