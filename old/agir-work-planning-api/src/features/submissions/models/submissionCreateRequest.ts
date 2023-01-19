import { IEnrichedProject, ISubmissionCreateRequest } from '@villemontreal/agir-work-planning-lib';
import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { ProjectFindOptions } from '../../projects/models/projectFindOptions';
import { projectRepository } from '../../projects/mongo/projectRepository';

// tslint:disable:no-empty-interface
export interface ISubmissionCreateRequestProps extends ISubmissionCreateRequest {}

export class SubmissionCreateRequest<P extends ISubmissionCreateRequestProps> extends AggregateRoot<P> {
  public static create(
    props: ISubmissionCreateRequestProps
  ): Result<SubmissionCreateRequest<ISubmissionCreateRequestProps>> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<SubmissionCreateRequest<ISubmissionCreateRequestProps>>(guard);
    }
    const submissionCreateRequest = new SubmissionCreateRequest(props, null);
    return Result.ok<SubmissionCreateRequest<ISubmissionCreateRequestProps>>(submissionCreateRequest);
  }

  public static guard(props: ISubmissionCreateRequestProps): IGuardResult {
    const guardProgramBookId: IGuardResult = Guard.guard({
      argument: props.programBookId,
      argumentName: `programBookId`,
      guardType: [GuardType.NULL_OR_UNDEFINED]
    });
    let guardProgramBookIdFormat: IGuardResult = { succeeded: true };
    if (guardProgramBookId.succeeded) {
      guardProgramBookIdFormat = Guard.guard({
        argument: props.programBookId,
        argumentName: `programBookId`,
        guardType: [GuardType.VALID_UUID]
      });
    }

    const guardProjectsIds: IGuardResult = Guard.guard({
      argument: props.projectIds,
      argumentName: `projectIds`,
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_ARRAY]
    });
    let guardProjectIdsFormat: IGuardResult[] = [{ succeeded: true }];
    if (guardProjectsIds.succeeded) {
      guardProjectIdsFormat = props.projectIds.map((pId, index) =>
        Guard.guard({
          argument: pId,
          argumentName: `projectIds[${index}]`,
          guardType: [GuardType.VALID_PROJECT_ID]
        })
      );
    }
    return Guard.combine([guardProgramBookId, guardProgramBookIdFormat, guardProjectsIds, ...guardProjectIdsFormat]);
  }

  public get programBookId(): string {
    return this.props.programBookId;
  }

  public get projectIds(): string[] {
    return this.props.projectIds;
  }

  private _projects: IEnrichedProject[];
  public get projects(): IEnrichedProject[] {
    return this._projects;
  }

  public async fetchProjects(): Promise<void> {
    this._projects = await projectRepository.findAll(
      ProjectFindOptions.create({
        criterias: {
          id: this.projectIds
        },
        fields: [
          'id',
          'executorId',
          'boroughId',
          'status',
          'drmNumber',
          'submissionNumber',
          'annualDistribution',
          'documents',
          'comments'
        ] as (keyof IEnrichedProject)[]
      }).getValue()
    );
  }

  public equals(otherSubmissionCreateRequest: SubmissionCreateRequest<any>): boolean {
    return this.innerEquals(otherSubmissionCreateRequest);
  }

  private innerEquals(otherSubmissionCreateRequest: SubmissionCreateRequest<any>): boolean {
    return (
      this.programBookId === otherSubmissionCreateRequest.programBookId &&
      this.projectIds === otherSubmissionCreateRequest.projectIds
    );
  }
}
