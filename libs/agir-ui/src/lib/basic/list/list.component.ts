import { Component, Directive, HostBinding, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';


@Directive({
  selector: 'vdm-list, [vdm-list]',
  standalone: true
})
export class ListDirective {
  @HostBinding('class.vdm-list') hostClass = true
  @HostBinding('attr.role') hostRole = 'list'
}

@Directive({
  selector: 'vdm-nav-list, [vdm-nav-list]',
  standalone: true
})
export class NavListDirective {
  @HostBinding('class.vdm-list') hostClass = true
  @HostBinding('attr.role') hostRole = 'navigation'
}

@Directive({
  selector: 'vdm-list-item-description, [vdm-list-item-description]',
  standalone: true
})
export class ListItemDescriptionDirective {
  @HostBinding('class') hostClass = 'vdm-list-item-description'
}

@Directive({
  selector: 'vdm-list-item-title, [vdm-list-item-title]',
  standalone: true
})
export class ListItemTitleDirective {
  @HostBinding('class') hostClass = 'vdm-list-item-title'
}


@Component({
  selector: 'vdm-list-item, [vdm-list-item]',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent, ListDirective, NavListDirective, ListItemDescriptionDirective, ListItemTitleDirective],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ListItemComponent {
  @HostBinding('class') hostClass = 'vdm-list-item'
  @HostBinding('attr.role') hostRole = 'listitem'
}
