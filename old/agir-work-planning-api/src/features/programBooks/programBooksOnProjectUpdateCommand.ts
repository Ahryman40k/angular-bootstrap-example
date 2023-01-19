import {
  IAsset,
  IEnrichedIntervention,
  IEnrichedProject,
  IEnrichedProjectAnnualPeriod,
  IInterventionAnnualPeriod,
  ProgramBookExpand
} from '@villemontreal/agir-work-planning-lib';
import { identity, isEmpty, isEqual, pickBy, uniq, uniqBy } from 'lodash';

import { constants } from '../../../config/constants';
import { errorMtlMapper } from '../../shared/domainErrors/errorMapperMtlApi';
import { InvalidParameterError } from '../../shared/domainErrors/invalidParameterError';
import { UnexpectedError } from '../../shared/domainErrors/unexpectedError';
import { Result } from '../../shared/logic/result';
import { annualProgramService } from '../annualPrograms/annualProgramService';
import { interventionRepository } from '../interventions/mongo/interventionRepository';
import { programBookPriorityScenarioService } from '../priorityScenarios/priorityScenarioService';
import { decisionTypesToProjectStatuses, projectService } from '../projects/projectService';
import { ProgramBook } from './models/programBook';
import { ProgramBookFindOptions } from './models/programBookFindOptions';
import { programBookRepository } from './mongo/programBookRepository';
import { programBookService } from './programBookService';

class ProgramBooksOnProjectUpdateCommand {
  private originalProject: IEnrichedProject = null;
  private originalIntervention: IEnrichedIntervention = null;
  private project: IEnrichedProject = null;
  private projectProgramBookIds: string[] = [];
  private originalProgramBookIds: string[] = [];
  private projectProgramBooks: ProgramBook[] = [];
  private originalProjectProgramBooks: ProgramBook[] = [];

  public async execute(
    originalProject: IEnrichedProject,
    project: IEnrichedProject,
    originalIntervention?: IEnrichedIntervention
  ): Promise<void> {
    this.projectProgramBooks = [];
    this.originalProjectProgramBooks = [];
    this.originalProject = originalProject;
    this.originalIntervention = originalIntervention;
    this.project = project;
    this.projectProgramBookIds = projectService.getProgramBookIds(this.project)?.map(id => id.toString());
    this.originalProgramBookIds = projectService.getProgramBookIds(this.originalProject)?.map(id => id.toString());
    if (!isEmpty(this.projectProgramBookIds)) {
      const programBookFindOptions = ProgramBookFindOptions.create({
        criterias: {
          id: this.projectProgramBookIds
        },
        offset: constants.PaginationDefaults.OFFSET,
        limit: this.projectProgramBookIds.length,
        expand: `${ProgramBookExpand.projects},${ProgramBookExpand.removedProjects}`
      });
      if (programBookFindOptions.isFailure) {
        throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(programBookFindOptions)));
      }
      this.projectProgramBooks = await programBookRepository.findAll(programBookFindOptions.getValue());
    }
    if (!isEmpty(this.originalProgramBookIds)) {
      const originalProgramBookFindOptions = ProgramBookFindOptions.create({
        criterias: {
          id: this.originalProgramBookIds
        },
        offset: constants.PaginationDefaults.OFFSET,
        limit: this.originalProgramBookIds.length,
        expand: `${ProgramBookExpand.projects},${ProgramBookExpand.removedProjects}`
      });
      if (originalProgramBookFindOptions.isFailure) {
        throw errorMtlMapper.toApiError(
          new InvalidParameterError(Result.combineForError(originalProgramBookFindOptions))
        );
      }
      this.originalProjectProgramBooks = await programBookRepository.findAll(originalProgramBookFindOptions.getValue());
    }
    const programBooksProjectRemoved = await this.getProgramBooksProjectRemoved();
    const outdatedPriorityScenariosProgramBooks = programBooksProjectRemoved.length
      ? []
      : await this.getOutdatedPriorityScenariosProgramBooks();
    this.updateProgramBooksProjectRemoved(programBooksProjectRemoved);
    const programBooksToUpdateObjectives = uniqBy(
      programBooksProjectRemoved.concat(outdatedPriorityScenariosProgramBooks),
      'id'
    );
    this.outdatePriorityScenariosProgramBooks(programBooksToUpdateObjectives);
    if (!isEmpty(programBooksToUpdateObjectives)) {
      const programBooksComputeObjetivesResults = Result.combine(
        await Promise.all(programBooksToUpdateObjectives.map(pb => pb.computeObjectives()))
      );
      if (programBooksComputeObjetivesResults.isFailure) {
        throw errorMtlMapper.toApiError(
          new InvalidParameterError(Result.combineForError(programBooksComputeObjetivesResults))
        );
      }
      for (const programBookToUpdateObjectives of programBooksToUpdateObjectives) {
        const saveResult = await programBookRepository.save(programBookToUpdateObjectives);
        if (saveResult.isFailure) {
          throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(saveResult)));
        }
      }
      await annualProgramService.syncAnnualProgramStatus(programBooksToUpdateObjectives);
    }
  }

  private updateProgramBooksProjectRemoved(programBooksProjectRemoved: ProgramBook[]): void {
    if (isEmpty(programBooksProjectRemoved)) {
      return;
    }
    for (const programBook of programBooksProjectRemoved) {
      programBookService.applyProjectDecisionOnProgramBook(programBook, this.originalProject, this.project);
    }
  }

  private outdatePriorityScenariosProgramBooks(outdatedPriorityScenariosProgramBooks: ProgramBook[]): void {
    if (isEmpty(outdatedPriorityScenariosProgramBooks)) {
      return;
    }
    programBookPriorityScenarioService.outdateProgramBooksPriorityScenarios(outdatedPriorityScenariosProgramBooks);
  }

  private async getProgramBooksProjectRemoved(): Promise<ProgramBook[]> {
    const programBooksRemovedProject: ProgramBook[] = [];

    for (const originalProgramBookId of this.originalProgramBookIds) {
      if (!this.projectProgramBookIds.includes(originalProgramBookId)) {
        programBooksRemovedProject.push(this.originalProjectProgramBooks.find(pb => pb.id === originalProgramBookId));
      }
    }
    return uniq(programBooksRemovedProject.filter(x => x));
  }

  private async getOutdatedPriorityScenariosProgramBooks(): Promise<ProgramBook[]> {
    let outdatedProgramBooks: ProgramBook[] = [];

    if (
      this.originalProject.interventionIds?.length !== this.project.interventionIds?.length ||
      !isEqual(this.originalProject.subCategoryIds, this.project.subCategoryIds) ||
      !isEqual(this.originalProject.servicePriorities, this.project.servicePriorities)
    ) {
      for (const projectAnnualPeriod of this.project.annualDistribution.annualPeriods) {
        outdatedProgramBooks.push(
          this.projectProgramBooks.find(pb => pb.id?.toString() === projectAnnualPeriod.programBookId?.toString())
        );
      }
    }
    const decisionStatuses: string[] = decisionTypesToProjectStatuses.map(s => s.projectStatusTo);
    if (!decisionStatuses.includes(this.project.status)) {
      await this.outdatedByInterventions(outdatedProgramBooks);
    } else {
      // project start and end year change only occur on decision and programBooks are removed from project on every decision
      outdatedProgramBooks = this.originalProjectProgramBooks || [];
    }
    return uniq(outdatedProgramBooks.filter(x => x));
  }

  private async outdatedByInterventions(outdatedProgramBooks: ProgramBook[]): Promise<void> {
    if (isEmpty(this.projectProgramBooks)) {
      return;
    }
    for (const projectAnnualPeriod of this.project.annualDistribution.annualPeriods) {
      const originalProjectAnnualPeriod = this.originalProject.annualDistribution.annualPeriods.find(
        ap => ap.year === projectAnnualPeriod.year
      );
      const originalInterventionIds = originalProjectAnnualPeriod.interventionIds?.sort();
      const interventionIds = projectAnnualPeriod.interventionIds?.sort();
      this.outdatedOnAddRemoveInterventionsFromProject(
        outdatedProgramBooks,
        projectAnnualPeriod,
        originalInterventionIds,
        interventionIds
      );
      await this.outdatedOnInterventionsChange(outdatedProgramBooks, projectAnnualPeriod);
    }
  }

  private outdatedOnAddRemoveInterventionsFromProject(
    outdatedProgramBooks: ProgramBook[],
    projectAnnualPeriod: IEnrichedProjectAnnualPeriod,
    originalInterventionIds: string[],
    interventionIds: string[]
  ): void {
    if (!isEqual(originalInterventionIds, interventionIds)) {
      outdatedProgramBooks.push(this.projectProgramBooks.find(pb => pb.id === projectAnnualPeriod.programBookId));
    }
  }

  private async outdatedOnInterventionsChange(
    outdatedProgramBooks: ProgramBook[],
    projectAnnualPeriod: IEnrichedProjectAnnualPeriod
  ): Promise<void> {
    if (!this.originalIntervention) {
      return;
    }

    const intervention = this.project.interventions
      ? this.project.interventions.find(i => i.id === this.originalIntervention.id)
      : await interventionRepository.findById(this.originalIntervention.id);

    const annualPeriod = intervention.annualDistribution.annualPeriods.find(ap => ap.year === projectAnnualPeriod.year);
    const originalAnnualPeriod = this.originalIntervention.annualDistribution.annualPeriods.find(
      ap => ap.year === projectAnnualPeriod.year
    );

    if (
      !this.isInterventionHasEqualRequestorId(intervention.requestorId, this.originalIntervention.requestorId) ||
      !this.isInterventionHasEqualWorkTypeId(intervention.workTypeId, this.originalIntervention.workTypeId) ||
      !this.isInterventionHasEqualAssets(intervention.assets, this.originalIntervention.assets) ||
      !this.isInterventionAPHasEqualAccountId(annualPeriod, originalAnnualPeriod) ||
      !this.isInterventionAPHasEqualAnnualAllowance(annualPeriod, originalAnnualPeriod)
    ) {
      outdatedProgramBooks.push(this.projectProgramBooks.find(pb => pb.id === projectAnnualPeriod.programBookId));
    }
  }

  private isInterventionHasEqualRequestorId(requestorId: string, originalRequestorId: string): boolean {
    return requestorId === originalRequestorId;
  }

  private isInterventionHasEqualWorkTypeId(workTypeId: string, originalWorkTypeId: string): boolean {
    return workTypeId === originalWorkTypeId;
  }

  private isInterventionHasEqualAssets(assets: IAsset[], originalAssets: IAsset[]): boolean {
    return isEqual(pickBy(assets, identity), pickBy(originalAssets, identity));
  }

  private isInterventionAPHasEqualAccountId(
    annualPeriod: IInterventionAnnualPeriod,
    originalAnnualPeriod: IInterventionAnnualPeriod
  ): boolean {
    return isEqual(annualPeriod.accountId, originalAnnualPeriod.accountId);
  }

  private isInterventionAPHasEqualAnnualAllowance(
    annualPeriod: IInterventionAnnualPeriod,
    originalAnnualPeriod: IInterventionAnnualPeriod
  ): boolean {
    return isEqual(annualPeriod.annualAllowance, originalAnnualPeriod.annualAllowance);
  }
}
export const programBooksOnProjectUpdateCommand = new ProgramBooksOnProjectUpdateCommand();
