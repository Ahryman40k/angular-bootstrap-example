import { NexoFileType, NexoImportStatus } from '@villemontreal/agir-work-planning-lib';
import { isEmpty } from 'lodash';
import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { INexoImportFileAttributes } from '../mongo/nexoImportLogModel';
import { NexoFileError } from './nexoFileError';
import { NexoLogIntervention } from './nexoLogIntervention';
import { NexoLogProject } from './nexoLogProject';

export interface INexoImportFileProps {
  name: string;
  contentType: string;
  status: NexoImportStatus;
  type: NexoFileType;
  projects?: NexoLogProject[];
  interventions?: NexoLogIntervention[];
  numberOfItems?: number;
  fileErrors?: NexoFileError[];
  storageId?: string;
}

export class NexoImportFile extends AggregateRoot<INexoImportFileProps> {
  public static create(props: INexoImportFileProps, id?: string): Result<NexoImportFile> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<NexoImportFile>(guard);
    }
    const nexoImportFile = new NexoImportFile(props, id);
    return Result.ok<NexoImportFile>(nexoImportFile);
  }

  public static guard(props: INexoImportFileProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.name,
        argumentName: 'name',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.contentType,
        argumentName: 'contentType',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.type,
        argumentName: 'type',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(NexoFileType)
      },
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(NexoImportStatus)
      },
      {
        argument: props.numberOfItems,
        argumentName: 'numberOfItems',
        guardType: [GuardType.IS_POSITIVE_INTEGER]
      }
    ];
    const guardBulkResult = Guard.guardBulk(guardBulk);

    return Guard.combine([...guardBulkResult]);
  }

  public static async toDomainModel(raw: INexoImportFileAttributes): Promise<NexoImportFile> {
    const projects = await Promise.all(raw.projects.map(project => NexoLogProject.toDomainModel(project)));
    const interventions = await Promise.all(
      raw.interventions.map(intervention => NexoLogIntervention.toDomainModel(intervention))
    );
    const fileErrors = await Promise.all(raw.fileErrors.map(error => NexoFileError.toDomainModel(error)));
    return NexoImportFile.create(
      {
        name: raw.name,
        contentType: raw.contentType,
        type: raw.type,
        status: raw.status,
        numberOfItems: raw.numberOfItems,
        fileErrors,
        projects,
        interventions,
        storageId: raw.id
      },
      raw.id?.toString()
    ).getValue();
  }

  public static toPersistance(nexoImportFile: NexoImportFile): INexoImportFileAttributes {
    return {
      id: nexoImportFile.storageId,
      name: nexoImportFile.name,
      contentType: nexoImportFile.contentType,
      type: nexoImportFile.type,
      status: nexoImportFile.status,
      numberOfItems: nexoImportFile.numberOfItems,
      fileErrors: nexoImportFile.fileErrors.map(error => NexoFileError.toPersistance(error)),
      projects: nexoImportFile.projects.map(project => NexoLogProject.toPersistance(project)),
      interventions: nexoImportFile.interventions.map(intervention => NexoLogIntervention.toPersistance(intervention))
    };
  }

  constructor(props: INexoImportFileProps, id: string) {
    super(props, id);
    if (isEmpty(props.projects)) {
      props.projects = [];
    }
    if (isEmpty(props.interventions)) {
      props.interventions = [];
    }
    if (isEmpty(props.fileErrors)) {
      props.fileErrors = [];
    }
  }

  public get name(): string {
    return this.props.name;
  }

  public get contentType(): string {
    return this.props.contentType;
  }

  public get type(): NexoFileType {
    return this.props.type;
  }

  public get status(): NexoImportStatus {
    if (
      !isEmpty(this.fileErrors) ||
      this.interventions.find(intervention => intervention.importStatus === NexoImportStatus.FAILURE)
    ) {
      return NexoImportStatus.FAILURE;
    }
    if (this.numberOfItems === this.interventions.length && isEmpty(this.fileErrors)) {
      return NexoImportStatus.SUCCESS;
    }
    return this.props.status;
  }

  public setStatus(status: NexoImportStatus) {
    this.props.status = status;
  }

  public get numberOfItems(): number {
    return this.props.numberOfItems;
  }

  public setNumberOfItems(numberOfItems: number): void {
    this.props.numberOfItems = numberOfItems;
  }

  public get fileErrors(): NexoFileError[] {
    return this.props.fileErrors;
  }

  public get projects(): NexoLogProject[] {
    return this.props.projects;
  }

  public get interventions(): NexoLogIntervention[] {
    return this.props.interventions;
  }

  public get storageId(): string {
    return this.props.storageId;
  }

  public setStorageId(id: string) {
    this.props.storageId = id;
  }

  public addErrors(errors: NexoFileError[]): void {
    this.props.fileErrors = [...this.props.fileErrors, ...errors];
  }

  public addProjects(projects: NexoLogProject[]): void {
    this.props.projects = [...this.props.projects, ...projects];
  }
}
