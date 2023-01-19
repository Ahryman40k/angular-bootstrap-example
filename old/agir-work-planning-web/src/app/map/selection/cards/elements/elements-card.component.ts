import { Component, ContentChild, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-elements-card',
  templateUrl: './elements-card.component.html',
  styleUrls: ['./elements-card.component.scss']
})
export class ElementsCardComponent {
  @Input() public cardTitle: string;
  @Input() public icon: string;
  @Input() public elements: any[];
  @Input() public opened = false;
  @Input() public isLoading = false;

  @ContentChild(TemplateRef) public elementTemplate: TemplateRef<any>;
}
