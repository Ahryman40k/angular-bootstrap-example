import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ITaxonomyAssetTypeDataKey, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';

@Component({
  selector: 'app-taxonomy-asset-data-keys-input',
  templateUrl: './taxonomy-asset-data-keys-input.component.html',
  styleUrls: ['./taxonomy-asset-data-keys-input.component.scss']
})
export class TaxonomyAssetDataKeysInputComponent implements OnInit {
  public TaxonomyGroup = TaxonomyGroup;

  public form: FormGroup;

  @Input() public dataKey: ITaxonomyAssetTypeDataKey;

  @Output() public remove = new EventEmitter();
  @Output() public update = new EventEmitter<ITaxonomyAssetTypeDataKey>();

  constructor(private readonly fb: FormBuilder) {}

  public ngOnInit(): void {
    this.createForm();
  }

  public createForm(): void {
    this.form = this.fb.group({
      code: [null, Validators.required],
      isMainAttribute: [null],
      displayOrder: [0, Validators.compose([Validators.required, Validators.pattern(/\d+/)])]
    });

    this.form.reset({
      code: this.dataKey.code,
      isMainAttribute: this.dataKey.isMainAttribute,
      displayOrder: Number(this.dataKey.displayOrder) // Make sure to return a number
    });

    this.form.valueChanges.subscribe(formValues => this.update.emit(formValues));
  }

  public emitRemove(): void {
    this.remove.emit();
  }
}
