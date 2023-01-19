import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-decision-cancel',
  templateUrl: './decision-cancel.component.html',
  styleUrls: ['./decision-cancel.component.scss']
})
export class DecisionCancelComponent implements OnInit {
  public form: FormGroup;
  @Output() public onCancel = new EventEmitter();
  @Output() public onSubmit = new EventEmitter();
  constructor(private readonly fb: FormBuilder) {}

  public ngOnInit(): void {
    this.createForm();
  }

  private createForm(): void {
    this.form = this.fb.group({});
    this.form.reset();
  }

  public cancel(): void {
    this.onCancel.emit();
  }

  public submit(): void {
    this.onSubmit.emit(this.form);
  }
}
