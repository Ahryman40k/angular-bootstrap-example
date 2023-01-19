import { Directive, HostBinding, Input } from '@angular/core';
import { v4 as uuid } from 'uuid';

const targetId = 'agir-work-planning-dual-screen-' + uuid();

/**
 * Directive that opens a link in a new tab
 */
@Directive({
  selector: '[appWindowLink]'
})
export class WindowAppLinkDirective {
  @HostBinding('target')
  @Input()
  public target = targetId;
}
