import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FormComponent } from '../../forms/form-component';
import { VdmSelectComponent } from '../vdm-select/vdm-select.component';

/**
 * A select dropdown with the style of a badge
 */
@Component({
  selector: 'vdm-select-badge',
  templateUrl: './vdm-select-badge.component.html',
  styleUrls: ['./vdm-select-badge.component.scss']
})
export class VdmSelectBadgeComponent extends VdmSelectComponent implements AfterViewInit {}
