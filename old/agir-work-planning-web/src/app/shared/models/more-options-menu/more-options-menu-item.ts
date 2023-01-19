import { Permission } from '@villemontreal/agir-work-planning-lib/dist/src';
import { IRestrictionItem } from '../../user/user-restrictions.service';

export interface IMoreOptionsMenuItem {
  label: string;
  link?: string;
  disabled?: boolean;
  linkNewWindow?: boolean;
  action?: () => void;
  permission?: Permission;
  // used to check if user have restriction on specific entity
  restrictionItems?: IRestrictionItem[];
}
