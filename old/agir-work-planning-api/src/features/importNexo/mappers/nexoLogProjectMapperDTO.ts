import { INexoLogProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { NexoLogProject } from '../models/nexoLogProject';
import { NexoLogElementMapperDTO } from './nexoLogElementMapperDTO';

class NexoLogProjectMapperDTO extends NexoLogElementMapperDTO<NexoLogProject, INexoLogProject> {}

export const nexoLogProjectMapperDTO = new NexoLogProjectMapperDTO();
