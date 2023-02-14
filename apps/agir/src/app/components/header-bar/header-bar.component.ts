import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent, IconComponent } from '@ahryman40k/agir-ui';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'agir-header-bar',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent],
  templateUrl: './header-bar.component.html',
  styleUrls: ['./header-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderBarComponent {}
