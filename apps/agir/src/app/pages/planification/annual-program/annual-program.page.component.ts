import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ButtonComponent,
  IconComponent,
  ListItemComponent,
  NavListDirective,
  PageHeaderComponent,
} from '@ahryman40k/agir-ui';
import { ProgrammationListviewComponent } from '../../../components/planification/programmation-listview/programmation-listview.component';
import { TaxonomyService } from '../../../services/taxonomy.service';
import { AnnualProgramService } from '../../../services/annual_program.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'agir-annual-program.page',
  standalone: true,
  imports: [
    CommonModule,

    ProgrammationListviewComponent,
    NavListDirective,
    ListItemComponent,
    IconComponent,
    ButtonComponent,
    PageHeaderComponent,
  ],
  providers: [
    TaxonomyService,
    AnnualProgramService
  ],
  templateUrl: './annual-program.page.component.html',
  styleUrls: ['./annual-program.page.component.scss'],
})
export class AnnualProgramPageComponent {
  private taxonomy = inject(TaxonomyService);
  private annual_program = inject(AnnualProgramService);

  executors$ = this.taxonomy.executors();
  annual_programs$ = this.annual_program.annual_program_byId('abc');
}
