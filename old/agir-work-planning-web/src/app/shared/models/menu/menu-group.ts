import { Observable } from 'rxjs';

import { IMenuItem } from './menu-item';

export interface IMenuGroup {
  title?: string;
  collapsible: boolean;
  items: IMenuItem[];
  isActive$?: Observable<boolean>;
}
