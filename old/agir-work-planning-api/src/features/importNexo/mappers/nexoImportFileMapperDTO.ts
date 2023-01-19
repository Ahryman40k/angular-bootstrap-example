import { INexoImportFile, INexoLogIntervention, INexoLogProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { NexoImportFile } from '../models/nexoImportFile';
import { nexoFileErrorMapperDTO } from './nexoFileErrorMapperDTO';
import { nexoLogInterventionMapperDTO } from './nexoLogInterventionMapperDTO';
import { nexoLogProjectMapperDTO } from './nexoLogProjectMapperDTO';

class NexoImportFileMapperDTO extends FromModelToDtoMappings<NexoImportFile, INexoImportFile, void> {
  protected async getFromNotNullModel(nexoImportFile: NexoImportFile): Promise<INexoImportFile> {
    const [projectsDTO, interventionsDTO, errorsAsString] = await Promise.all<
      INexoLogProject[],
      INexoLogIntervention[],
      string[]
    >([
      nexoLogProjectMapperDTO.getFromModels(nexoImportFile.projects),
      nexoLogInterventionMapperDTO.getFromModels(nexoImportFile.interventions),
      nexoFileErrorMapperDTO.getFromModels(nexoImportFile.fileErrors)
    ]);
    return this.map(nexoImportFile, projectsDTO, interventionsDTO, errorsAsString);
  }

  private map(
    nexoImportFile: NexoImportFile,
    projectsDTO: INexoLogProject[],
    interventionsDTO: INexoLogIntervention[],
    errorsAsString: string[]
  ): INexoImportFile {
    return {
      id: nexoImportFile.id,
      name: nexoImportFile.name,
      contentType: nexoImportFile.contentType,
      type: nexoImportFile.type,
      status: nexoImportFile.status,
      numberOfItems: nexoImportFile.numberOfItems,
      errorDescription: errorsAsString.join('.\n'),
      projects: projectsDTO,
      interventions: interventionsDTO
    };
  }
}

export const nexoImportFileMapperDTO = new NexoImportFileMapperDTO();
