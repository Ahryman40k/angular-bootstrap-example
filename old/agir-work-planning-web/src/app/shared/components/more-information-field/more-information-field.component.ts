import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { BaseComponent } from '../base/base.component';

@Component({
  selector: 'app-more-information-field',
  templateUrl: 'more-information-field.component.html'
})
export class MoreInformationFieldComponent extends BaseComponent implements OnInit {
  @Input() public fieldTitle: string;
  @Input() public saveAction: () => Promise<boolean>;
  @Input() public canEdit = true;

  @Output() public cancel = new EventEmitter();

  public isEditing = false;
  public isSaving = false;

  public toggleEdition(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.cancel.emit();
    }
  }

  public async save(): Promise<void> {
    this.isSaving = true;
    try {
      const succeeded = await this.saveAction();
      if (succeeded) {
        this.isEditing = false;
      }
    } finally {
      this.isSaving = false;
    }
  }
}
