import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NgbDropdownMenu } from '@ng-bootstrap/ng-bootstrap';
import { combineLatest, from, Subject } from 'rxjs';

import { isEmpty } from 'lodash';
import { IMoreOptionsMenuItem } from '../../models/more-options-menu/more-options-menu-item';
import { UserRestrictionsService } from '../../user/user-restrictions.service';
import { UserService } from '../../user/user.service';

@Component({
  selector: 'app-more-options-button',
  templateUrl: './more-options-button.component.html',
  styleUrls: ['./more-options-button.component.scss']
})
export class MoreOptionsButtonComponent {
  private _items: IMoreOptionsMenuItem[];
  private readonly itemsChanged = new Subject<IMoreOptionsMenuItem[]>();
  public shownItems: IMoreOptionsMenuItem[];

  public get items(): IMoreOptionsMenuItem[] {
    return this._items;
  }
  @Input() public set items(menuItems: IMoreOptionsMenuItem[]) {
    this._items = menuItems;
    this.itemsChanged.next(menuItems);
  }

  @Input() public dropdownPlacement: string | string[] = 'left-top';
  @Input() public dropdownContainer: string;
  @Input() public buttonClass: string;
  @Input() public disabled: boolean = false;

  @ViewChild('dropdownMenu')
  public dropdownMenu: ElementRef<HTMLDivElement>;

  @ViewChild('dropdownMenu', { read: NgbDropdownMenu })
  public dropdownMenuComponent: NgbDropdownMenu;

  public get hasItems(): boolean {
    return !!this.dropdownMenu.nativeElement.children.length;
  }

  constructor(
    private readonly userService: UserService,
    private readonly userRestrictionsService: UserRestrictionsService
  ) {
    this.createShownItemsObservable();
  }

  private createShownItemsObservable(): void {
    combineLatest(this.itemsChanged, from(this.userService.getCurrentUser())).subscribe(([items, user]) => {
      this.shownItems = items?.filter(
        i =>
          (!i.permission || user.hasPermission(i.permission)) &&
          (isEmpty(i.restrictionItems) || this.userRestrictionsService.validate(i.restrictionItems))
      );
    });
  }
}
