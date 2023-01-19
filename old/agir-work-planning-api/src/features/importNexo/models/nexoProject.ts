import {
  InterventionExternalReferenceType,
  ModificationType,
  NexoImportStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { IProjectProps, Project } from '../../projects/models/project';
import { NexoLogProject } from './nexoLogProject';
import { NexoRow, NO_ID_PROVIDED } from './rows/nexoRow';

export interface INexoProjectProps extends IProjectProps {
  modificationType?: ModificationType;
  lineNumber: number;
  nexoId: string;
}

export class NexoProject extends Project<INexoProjectProps> {
  public static create(props: INexoProjectProps, id?: string): Result<NexoProject> {
    const guardResult = Guard.combine([Project.guard(props), this.guard(props)]);
    if (!guardResult.succeeded) {
      const nexoId = props?.nexoId ? props.nexoId : NO_ID_PROVIDED;
      return Result.fail<NexoProject>(NexoRow.guardResultToNexoFileErrors<any>(guardResult, props, nexoId));
    }
    const nexoProject = new NexoProject(props, id);
    return Result.ok<NexoProject>(nexoProject);
  }

  public static guard(props: INexoProjectProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.modificationType,
        argumentName: 'modificationType',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(ModificationType)
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);

    return Guard.combine([...guardBulkResult]);
  }

  public get modificationType(): ModificationType {
    if (!this.props.modificationType) {
      return ModificationType.CREATION;
    }
    return this.props.modificationType;
  }

  public get nexoId(): string {
    return this.props.nexoId;
  }

  public toNexoLogProject(): NexoLogProject {
    return NexoLogProject.create(
      {
        importStatus: NexoImportStatus.SUCCESS,
        modificationType: this.modificationType
      },
      this.externalReferenceIds.find(extId => extId.type === InterventionExternalReferenceType.nexoReferenceNumber)
        .value
    ).getValue();
  }
}

export const isNexoProject = (v: any): v is NexoProject => {
  return v instanceof NexoProject;
};
