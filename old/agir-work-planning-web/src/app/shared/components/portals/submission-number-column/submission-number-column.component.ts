import { Component } from '@angular/core';
import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { BaseComponentPortal } from '../base-column-portal';

export interface ISubmissionLinkData {
  project: IEnrichedProject;
  isSubmissionInvalid?: boolean;
}
@Component({
  selector: 'app-submission-number-column',
  templateUrl: './submission-number-column.component.html',
  styleUrls: ['./submission-number-column.component.scss']
})
export class SubmissionNumberColumnComponent extends BaseComponentPortal<ISubmissionLinkData> {}
