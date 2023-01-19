import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ITaxonomy, Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { ILinkedObject, linkedObjects } from 'src/app/shared/models/interventions/linked-objects';

@Component({
  selector: 'app-comment-form-layout',
  templateUrl: 'comment-form-layout.component.html'
})
export class CommentFormLayoutComponent {
  @Input() public form: FormGroup;
  @Input() public commentCategories: ITaxonomy[];
  public linkedObjects: ILinkedObject[] = linkedObjects;
  @Input() public canWritePrivateComment: boolean = true;
}
