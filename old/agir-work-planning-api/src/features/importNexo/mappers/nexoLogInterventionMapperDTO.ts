import { INexoLogIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import { NexoLogIntervention } from '../models/nexoLogIntervention';
import { nexoFileErrorMapperDTO } from './nexoFileErrorMapperDTO';
import { NexoLogElementMapperDTO } from './nexoLogElementMapperDTO';

class NexoLogInterventionMapperDTO extends NexoLogElementMapperDTO<NexoLogIntervention, INexoLogIntervention> {
  protected async getFromNotNullModel(nexoLogIntervention: NexoLogIntervention): Promise<INexoLogIntervention> {
    const errorsAsString = await nexoFileErrorMapperDTO.getFromModels(nexoLogIntervention.errors, {
      line: nexoLogIntervention.lineNumber
    });
    return this.map(nexoLogIntervention, errorsAsString);
  }

  protected map(nexoLogIntervention: NexoLogIntervention, errorsAsString: string[]): INexoLogIntervention {
    return {
      ...super.map(nexoLogIntervention, errorsAsString),
      lineNumber: nexoLogIntervention.lineNumber
    };
  }
}

export const nexoLogInterventionMapperDTO = new NexoLogInterventionMapperDTO();
