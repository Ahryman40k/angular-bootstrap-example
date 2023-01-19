import { Component, Input } from '@angular/core';
import { IEnrichedProject, ISubmission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { DrmSubmissionNumberFormatPipe } from '../../pipes/drm-submission-number-format.pipe';
import { BaseComponent } from '../base/base.component';

@Component({
  selector: 'app-submission-link',
  templateUrl: './submission-link.component.html',
  styleUrls: ['./submission-link.component.scss']
})
export class SubmissionLinkComponent extends BaseComponent {
  @Input() public object: ISubmission | IEnrichedProject;
  @Input() public customText: string;

  constructor(readonly appDrmSumbissionPipe: DrmSubmissionNumberFormatPipe) {
    super();
  }
  public get hrefSubmission() {
    return `window/submissions/${this.object.submissionNumber}/projects`;
  }

  public get linkText(): string {
    return this.customText ? this.customText : this.appDrmSumbissionPipe.transform(this.object);
  }
}
