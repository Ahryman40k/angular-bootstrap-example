import { Component, ElementRef, Input, ViewChild } from '@angular/core';

export enum AlertType {
  success = 'success',
  warning = 'warning',
  danger = 'danger'
}
@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent {
  @Input() public type: AlertType;
  @Input() public showIcon: string = 'true';
  @Input() public iconName: string = 'icon-warning';

  @ViewChild('heading')
  public viewChildHeading: ElementRef<HTMLDivElement>;

  public get alertClass(): any {
    const c = {};
    if (!this.type) {
      return c;
    }
    c[`alert-${this.type}`] = true;
    return c;
  }

  public get hasTitle(): boolean {
    return !!this.viewChildHeading.nativeElement.children.length;
  }
}
