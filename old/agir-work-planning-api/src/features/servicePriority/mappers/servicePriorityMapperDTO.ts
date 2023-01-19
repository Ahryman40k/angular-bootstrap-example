import { IServicePriority } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { ServicePriority } from '../models/servicePriority';

class ServicePriorityMapperDTO extends FromModelToDtoMappings<ServicePriority, IServicePriority, void> {
  protected async getFromNotNullModel(servicePriority: ServicePriority): Promise<IServicePriority> {
    return this.map(servicePriority);
  }

  private map(servicePriority: ServicePriority): IServicePriority {
    return {
      service: servicePriority.service,
      priorityId: servicePriority.priorityId
    };
  }
}

export const servicePriorityMapperDTO = new ServicePriorityMapperDTO();
