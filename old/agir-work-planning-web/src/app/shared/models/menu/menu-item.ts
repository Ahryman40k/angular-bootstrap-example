import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';

export interface IMenuItem {
  link: string | string[];
  icon?: string;
  title: string;
  inWindow?: boolean;
  permission?: Permission;
  isActive$?: Observable<boolean>;
  isDisabled?: boolean;
}
