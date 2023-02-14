import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent, IconComponent, ListItemComponent, NavListDirective, TagComponent } from '@ahryman40k/agir-ui';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'agir-programmation-listview',
  standalone: true,
  imports: [CommonModule, NavListDirective, ListItemComponent, ButtonComponent, IconComponent, TagComponent ],
  templateUrl: './programmation-listview.component.html',
  styleUrls: ['./programmation-listview.component.scss'],
})
export class ProgrammationListviewComponent {}
