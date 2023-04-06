import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent, IconComponent, ListItemComponent, MenuComponent, MenuItemDirective, MenuItemLabelDirective, MenuTriggerDirective, NavListDirective, TagComponent } from '@ahryman40k/agir-ui';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'agir-programmation-listview',
  standalone: true,
  imports: [CommonModule, NavListDirective, ListItemComponent, ButtonComponent, IconComponent, TagComponent, MenuComponent, MenuItemDirective, MenuItemLabelDirective, MenuTriggerDirective ],
  templateUrl: './programmation-listview.component.html',
  styleUrls: ['./programmation-listview.component.scss'],
})
export class ProgrammationListviewComponent {
  @Input() programs: { name: string, status: string }[] | null = [];
}
