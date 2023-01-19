import { Component, ViewChild } from '@angular/core';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';

interface IContextualMenuStyle {
  left?: string;
  top?: string;
  right?: string;
  bottom?: string;
}

const CONTEXTUAL_MENU_PADDING_PX = 5;

@Component({
  selector: 'app-contextual-menu',
  templateUrl: './contextual-menu.component.html',
  styleUrls: ['./contextual-menu.component.scss']
})
export class ContextualMenuComponent {
  @ViewChild('contextualMenuDropdown') public contextualMenuDropdown: NgbDropdown;
  public contextualMenuStyle: IContextualMenuStyle = {};

  /**
   * Opens the contextual menu.
   * Opens it depending on the mouse position on the screen,
   * in order to avoid opening the menu outside the screen.
   * @param ev The mouse event
   */
  public open(ev: MouseEvent): void {
    const target = ev.target as HTMLElement;
    this.contextualMenuStyle = {};
    if (ev.clientX < target.clientWidth / 2) {
      this.contextualMenuStyle.left = `${ev.x + CONTEXTUAL_MENU_PADDING_PX}px`;
    } else {
      this.contextualMenuStyle.right = `${window.innerWidth - ev.x + CONTEXTUAL_MENU_PADDING_PX}px`;
    }
    if (ev.clientY < target.clientHeight / 2) {
      this.contextualMenuStyle.top = `${ev.y + CONTEXTUAL_MENU_PADDING_PX}px`;
    } else {
      this.contextualMenuStyle.bottom = `${window.innerHeight - ev.y + CONTEXTUAL_MENU_PADDING_PX}px`;
    }
    this.contextualMenuDropdown.open();
  }
}
