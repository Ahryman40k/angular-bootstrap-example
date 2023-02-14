import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './basic/button/button.component';
import { IconComponent } from './basic/icon/icon.component';
import { PageHeaderComponent } from './app/page-header/page-header.component';
import {
  ListDirective,
  ListItemComponent,
  ListItemDescriptionDirective,
  ListItemTitleDirective,
  NavListDirective,
} from './basic/list/list.component';
import { TagComponent } from './basic/tag/tag.component';
import { MenuComponent } from './basic/menu/menu.component';
import { MenuDividerComponent } from './basic/menu/menu-divider.component';
import { MenuItemDescriptionDirective } from './basic/menu/menu-item-description.directive';
import { MenuItemDirective } from './basic/menu/menu-item.directive';
import { MenuItemLabelDirective } from './basic/menu/menu-item-label.directive';
import { MenuSectionDirective } from './basic/menu/menu-section.directive';
import { MenuTriggerDirective } from './basic/menu/menu-trigger.directive';
import { AvatarComponent, AvatarContentDirective } from './basic/avatar/avatar.component';
import { AlertComponent } from './basic/alert/alert.component';
import { BadgeComponent } from './basic/badge/badge.component';
import { BreadcrumbComponent } from './basic/breadcrumb/breadcrumb.component';
import { CardComponent } from './basic/card/card.component';
import { CheckboxComponent } from './basic/checkbox/checkbox.component';
import { SnackbarComponent } from './basic/snackbar/snackbar.component';
import { ModalComponent } from './basic/modal/modal.component';
import { RadioComponent } from './basic/radio/radio.component';

export const libraryModules = [
  AlertComponent,
  AvatarComponent,
  AvatarContentDirective,
  BadgeComponent,
  BreadcrumbComponent,
  ButtonComponent,
  CardComponent,
  CheckboxComponent,
  IconComponent,
  ModalComponent,
  RadioComponent,
  SnackbarComponent,
  TagComponent,
  ListItemComponent,
  ListItemDescriptionDirective,
  ListItemTitleDirective,
  ListDirective,
  NavListDirective,
  MenuComponent,
  MenuDividerComponent,
  MenuItemDescriptionDirective,
  MenuItemDirective,
  MenuItemLabelDirective,
  MenuSectionDirective,
  MenuTriggerDirective,

  PageHeaderComponent,
];

@NgModule({
  imports: [CommonModule, ...libraryModules],
  exports: [...libraryModules],
  declarations: [
    AlertComponent,
    BadgeComponent,
    BreadcrumbComponent,
    CardComponent,
    CheckboxComponent,
    SnackbarComponent,
    ModalComponent,
    RadioComponent,
  ],
})
export class AgirUiModule {}
