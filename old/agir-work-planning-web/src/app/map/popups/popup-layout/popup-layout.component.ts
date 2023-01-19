import { Component, ContentChild, Input } from '@angular/core';

@Component({
  selector: 'app-popup-layout',
  templateUrl: 'popup-layout.component.html',
  styleUrls: ['./popup-layout.component.scss']
})
export class PopupLayoutComponent {
  @Input() public colorClass: string;
  @ContentChild('[header]') public contentChildHeader: HTMLElement;

  get hasHeader(): boolean {
    return !!this.contentChildHeader;
  }
}
