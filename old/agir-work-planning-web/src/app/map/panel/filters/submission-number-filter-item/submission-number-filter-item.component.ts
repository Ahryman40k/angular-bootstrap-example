import { Component } from '@angular/core';
import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { FilterItemComponent } from '../filter-item/filter-item.component';

@Component({
  selector: 'app-submission-number-filter-item',
  templateUrl: './submission-number-filter-item.component.html',
  styleUrls: ['./submission-number-filter-item.component.scss']
})
export class SubmissionNumberFilterItemComponent extends FilterItemComponent {
  public Permission = Permission;

  public get hrefSubmission() {
    return `window/submissions/${this.item.label}/projects`;
  }
}
