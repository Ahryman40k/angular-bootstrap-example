import { Component } from '@angular/core';
import {
  IProgressHistoryItem,
  IStatusHistoryItem,
  ISubmission,
  SubmissionStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { orderBy } from 'lodash';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { WindowSubmissionStoreService } from 'src/app/shared/services/window-submission-store.service';

@Component({
  selector: 'app-submission-history',
  templateUrl: './submission-history.component.html',
  styleUrls: ['./submission-history.component.scss']
})
export class SubmissionHistoryComponent extends BaseComponent {
  public SubmissionStatus = SubmissionStatus;
  constructor(private readonly windowSubmissionStoreService: WindowSubmissionStoreService) {
    super();
  }

  public get submission(): ISubmission {
    return this.windowSubmissionStoreService.submission;
  }

  public get lastStatus(): IStatusHistoryItem {
    try {
      return this.submission.statusHistory[this.submission.statusHistory.length - 1];
    } catch (e) {
      return undefined;
    }
  }

  public get mixedHistory(): (IStatusHistoryItem | IProgressHistoryItem)[] {
    return [...this.submission.statusHistory, ...this.submission.progressHistory];
  }
}
