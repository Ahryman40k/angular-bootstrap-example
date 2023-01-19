import { Result } from '../../../shared/logic/result';
import { INexoLogProjectAttributes } from '../mongo/nexoImportLogModel';
import { NexoFileError } from './nexoFileError';
import { INexoLogElementProps, NexoLogElement } from './nexoLogElement';

// tslint:disable:no-empty-interface
export interface INexoLogProjectProps extends INexoLogElementProps {}

export class NexoLogProject extends NexoLogElement<INexoLogProjectProps> {
  public static create(props: INexoLogProjectProps, id?: string): Result<NexoLogProject> {
    const guardElement = NexoLogElement.guard(props);
    if (!guardElement.succeeded) {
      return Result.fail<NexoLogProject>(guardElement);
    }
    const nexoLogProject = new NexoLogProject(props, id);
    return Result.ok<NexoLogProject>(nexoLogProject);
  }

  public static async toDomainModel(raw: INexoLogProjectAttributes): Promise<NexoLogProject> {
    const errors = await Promise.all(raw.elementErrors.map(async error => NexoFileError.toDomainModel(error)));
    return NexoLogProject.create(
      {
        importStatus: raw.importStatus,
        modificationType: raw.modificationType,
        errors
      },
      raw.id
    ).getValue();
  }

  public static toPersistance(nexoLogProject: NexoLogProject): INexoLogProjectAttributes {
    return {
      id: nexoLogProject.id,
      importStatus: nexoLogProject.importStatus,
      modificationType: nexoLogProject.modificationType,
      elementErrors: nexoLogProject.errors.map(error => NexoFileError.toPersistance(error))
    };
  }
}
