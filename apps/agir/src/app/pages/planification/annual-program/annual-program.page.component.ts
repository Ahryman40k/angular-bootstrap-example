import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent, IconComponent, ListItemComponent, NavListDirective, PageHeaderComponent } from '@ahryman40k/agir-ui';
import { ProgrammationListviewComponent } from '../../../components/planification/programmation-listview/programmation-listview.component';
import { TaxonomyService } from '../../../services/taxonomy.service';
import { fakeBackendProvider } from '../../../interceptors/fake-backend.interceptor';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'agir-annual-program.page',
  standalone: true,
  imports: [CommonModule, ProgrammationListviewComponent, NavListDirective, ListItemComponent, IconComponent, ButtonComponent, PageHeaderComponent],
  providers: [
    fakeBackendProvider
  ],
  templateUrl: './annual-program.page.component.html',
  styleUrls: ['./annual-program.page.component.scss'],
})
export class AnnualProgramPageComponent {

  executors$ = this.taxonomy.executors(); 

  constructor( private taxonomy: TaxonomyService) {

  }


}
