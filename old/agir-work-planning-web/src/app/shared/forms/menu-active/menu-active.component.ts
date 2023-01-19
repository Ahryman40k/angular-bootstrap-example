import { Component, Input } from '@angular/core';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';

export interface IMenuItem {
  key: string;
  label?: string;
  label$?: Observable<string> | Promise<string>;
  link: string[];
  permission?: Permission;
  disabled?: boolean;
}
@Component({
  selector: 'app-menu-active',
  templateUrl: './menu-active.component.html',
  styleUrls: ['./menu-active.component.scss']
})
export class MenuActiveComponent {
  @Input() public item: IMenuItem;
}
