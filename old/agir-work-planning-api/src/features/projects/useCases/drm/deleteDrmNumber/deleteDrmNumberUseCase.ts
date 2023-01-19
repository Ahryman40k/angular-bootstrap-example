import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, isEmpty, uniq } from 'lodash';

import { constants } from '../../../../../../config/constants';
import { IByIdCommandProps } from '../../../../../shared/domain/useCases/byIdCommand';
import { DeleteUseCase } from '../../../../../shared/domain/useCases/deleteUseCase/deleteUseCase';
import { Response } from '../../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../../shared/logic/left';
import { Result } from '../../../../../shared/logic/result';
import { right } from '../../../../../shared/logic/right';
import { convertStringOrStringArray } from '../../../../../utils/arrayUtils';
import { ICounter } from '../../../../counters/models/counter';
import { IHistoryOptions } from '../../../../history/mongo/historyRepository';
import { ProgramBook } from '../../../../programBooks/models/programBook';
import { ProgramBookFindOptions } from '../../../../programBooks/models/programBookFindOptions';
import { programBookRepository } from '../../../../programBooks/mongo/programBookRepository';
import { ProjectFindOptions } from '../../../models/projectFindOptions';
import { drmCounterRepository } from '../../../mongo/drmCounterRepository';
import { projectRepository } from '../../../mongo/projectRepository';
import { DrmProjectValidator } from '../../../validators/drm/DrmProjectValidator';
import { projectValidator } from '../../../validators/projectValidator';
import { ByProjectIdCommand } from '../../byProjectIdCommand';

export class DeleteDrmNumberUseCase extends DeleteUseCase<any, IByIdCommandProps> {
  protected createCommand(req: IByIdCommandProps): Result<ByProjectIdCommand<IByIdCommandProps>> {
    return ByProjectIdCommand.create(req);
  }

  public async execute(req: IByIdCommandProps): Promise<Response<void>> {
    const deleteCmdResult = this.createCommand(req);
    if (deleteCmdResult.isFailure) {
      return left(new InvalidParameterError(Result.combine([deleteCmdResult]).error));
    }
    const deleteCmd = deleteCmdResult.getValue();
    const inputProjectIds = convertStringOrStringArray(deleteCmd.id);

    const initialProjects = await projectRepository.findAll(
      ProjectFindOptions.create({ criterias: { id: inputProjectIds } }).getValue()
    );
    if (isEmpty(initialProjects)) {
      return left(new NotFoundError(`Projects were not found : ${deleteCmd.id}`));
    }
    const restrictionResult = Result.combine(initialProjects.map(pr => projectValidator.validateRestrictions(pr)));
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(Result.combineForError(restrictionResult)));
    }
    const businessRulesResults = DrmProjectValidator.validateDeleteBusinessRules(initialProjects);
    if (businessRulesResults.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResults)));
    }

    const availableValues: number[] = [];
    const updatedProjects = cloneDeep(initialProjects);
    const drmNumbers = updatedProjects.map(p => p.drmNumber).filter(x => x);

    const otherDrmNumberProjects = await projectRepository.findAll(
      ProjectFindOptions.create({ criterias: { drmNumbers, excludeIds: inputProjectIds } }).getValue()
    );

    const drmNumberNotAvailables = otherDrmNumberProjects.map(p => p.drmNumber).filter(x => x);

    for (const p of updatedProjects) {
      if (!drmNumberNotAvailables.includes(p.drmNumber)) {
        availableValues.push(parseInt(p.drmNumber, 10));
      }

      // TODO: change null to undefined when project will be refactored
      p.drmNumber = null;
    }

    let programBookIds: string[] = [];
    const projectPromises = updatedProjects.map(async updatedProject => {
      const historyOptions: IHistoryOptions = {
        operation: constants.operation.UPDATE,
        categoryId: constants.historyCategoryId.DRM_NUMBER,
        comments: constants.systemMessages.DRM_NUMBER_DELETED
      };

      programBookIds = uniq([
        ...programBookIds,
        ...updatedProject.annualDistribution?.annualPeriods?.map(ap => ap.programBookId)?.filter(x => x)
      ]);

      return projectRepository.save(updatedProject, { history: historyOptions });
    });

    const drmNumberCounter = await drmCounterRepository.findOne({
      key: 'drm',
      prefix: undefined
    });
    if (!drmNumberCounter) {
      const possibleErrorResultCombine = Result.combineForError(Result.fail(`Drm number counter was not found`));
      return left(new NotFoundError(possibleErrorResultCombine.errorValue()));
    }

    const results = await Promise.all(projectPromises);
    const result = Result.combine(results);

    if (result.isFailure) {
      return left(new UnexpectedError(Result.combineForError(result)));
    }

    const initialProgramBooks = await programBookRepository.findAll(
      ProgramBookFindOptions.create({
        criterias: {
          id: programBookIds
        }
      }).getValue()
    );
    const updatedProgramBooks = cloneDeep(initialProgramBooks);
    const outdatedProgramBookPromises: Promise<Result<ProgramBook>>[] = [];
    for (const programBook of updatedProgramBooks) {
      programBook.outdatePriorityScenarios();
      outdatedProgramBookPromises.push(programBookRepository.save(programBook));
    }

    const programBookResults = await Promise.all(outdatedProgramBookPromises);
    const programBookResultCombine = Result.combine(programBookResults);
    if (programBookResultCombine.isFailure) {
      const projectResults = await this.rollbackProjects(initialProjects);
      const drmCounterResult = await this.rollbackDrmCounter(drmNumberCounter);
      const possibleErrorResultCombine = Result.combine([projectResults, drmCounterResult, programBookResultCombine]);
      return left(
        new UnexpectedError(
          possibleErrorResultCombine.errorValue(),
          `Something went wrong while outdating program books`
        )
      );
    }

    drmNumberCounter.availableValues = uniq([...drmNumberCounter.availableValues, ...availableValues]).sort(
      (a, b) => a - b
    );

    const newCounter = await drmCounterRepository.save(drmNumberCounter);
    if (!newCounter) {
      const projectResults = await this.rollbackProjects(initialProjects);
      const programBookResultList2 = await this.rollbackProgramBooks(initialProgramBooks);
      const possibleErrorResultCombine = Result.combine([projectResults, programBookResultList2]);
      return left(
        new UnexpectedError(
          possibleErrorResultCombine.errorValue(),
          `Something went wrong while persisting drm counter`
        )
      );
    }

    return right(Result.ok<void>());
  }

  private async rollbackProjects(projects: IEnrichedProject[]): Promise<Result<IEnrichedProject>> {
    return Result.combine(
      await Promise.all(
        projects.map(p =>
          projectRepository.save(p, {
            history: {
              operation: constants.operation.UPDATE,
              categoryId: constants.historyCategoryId.DRM_NUMBER,
              comments: constants.systemMessages.PROJECT_ROLLBACK
            }
          })
        )
      )
    );
  }

  private async rollbackProgramBooks(programBooks: ProgramBook[]): Promise<Result<ProgramBook>> {
    return Result.combine(await Promise.all(programBooks.map(pb => programBookRepository.save(pb))));
  }

  private async rollbackDrmCounter(drmNumberCounter: ICounter): Promise<Result<ICounter>> {
    const newCounter = await drmCounterRepository.save(drmNumberCounter);
    return newCounter ? Result.ok<ICounter>(newCounter) : Result.fail<ICounter>('Drm number failed to rollback');
  }
}
export const deleteDrmNumberUseCase = new DeleteDrmNumberUseCase();
