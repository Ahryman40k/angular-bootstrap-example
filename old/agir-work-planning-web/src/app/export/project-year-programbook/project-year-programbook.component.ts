import { Component, Inject } from '@angular/core';
import { BaseComponentPortal } from 'src/app/shared/components/portals/base-column-portal';
import { COLUMN_DATA } from 'src/app/shared/tokens/tokens';

@Component({
  selector: 'app-project-year-programbook',
  templateUrl: './project-year-programbook.component.html',
  styleUrls: ['./project-year-programbook.component.css']
})
export class ProjectYearProgrambookComponent extends BaseComponentPortal<any> {
  constructor(@Inject(COLUMN_DATA) public data: any) {
    super(data);
  }
}