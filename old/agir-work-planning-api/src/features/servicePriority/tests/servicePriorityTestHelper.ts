import { PriorityCode } from '@villemontreal/agir-work-planning-lib';

import { SERVICE_SUM } from '../../../shared/taxonomies/constants';
import { IServicePriorityProps, ServicePriority } from '../models/servicePriority';

export function getServicePriorityProps(props?: IServicePriorityProps) {
  return {
    service: SERVICE_SUM,
    priorityId: PriorityCode.mediumPriority,
    ...props
  };
}

export function getServicePriority(props?: IServicePriorityProps): ServicePriority {
  return ServicePriority.create(getServicePriorityProps(props)).getValue();
}
