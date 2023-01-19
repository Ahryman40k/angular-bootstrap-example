import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';

@Component({
  selector: 'app-year-selection-modal',
  templateUrl: './year-selection-modal.component.html',
  styleUrls: ['./year-selection-modal.component.scss']
})
export class YearSelectionModalComponent implements OnInit {
  @Input() public title: string;
  @Input() public project: IEnrichedProject;
  @Input() public years: number[];
  @Input() public formMessage: string;
  @Input() public buttonLabel: string;

  public form: FormGroup;

  constructor(private readonly activeModal: NgbActiveModal, private readonly fb: FormBuilder) {}

  public ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      year: [this.years[0], Validators.required]
    });
  }

  public cancel(): void {
    this.form.reset();
    this.activeModal.close(null);
  }

  public submit(): void {
    this.activeModal.close(this.form.controls.year.value);
  }
}
