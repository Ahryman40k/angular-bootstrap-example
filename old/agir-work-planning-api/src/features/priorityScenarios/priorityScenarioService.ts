import {
  IEnrichedIntervention,
  IEnrichedProgramBook,
  IEnrichedProject,
  IOrderedProject,
  IPriorityLevelSortCriteria,
  IPriorityScenario,
  ITaxonomy,
  ProgramBookObjectiveType,
  ProgramBookPriorityLevelSort,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, isEmpty as isEmptyLodash, isNil, maxBy, orderBy, remove, sortBy, uniq } from 'lodash';

import { Result } from '../../shared/logic/result';
import { isEmpty } from '../../utils/utils';
import { ProjectAnnualPeriod } from '../annualPeriods/models/projectAnnualPeriod';
import { Audit } from '../audit/audit';
import { Objective } from '../programBooks/models/objective';
import { ProgramBook } from '../programBooks/models/programBook';
import { taxonomyService } from '../taxonomies/taxonomyService';
import { OrderedProject } from './models/orderedProject';
import { IPlainPriorityLevelProps, PlainPriorityLevel } from './models/plainPriorityLevel';
import { PriorityLevel } from './models/priorityLevel';
import { OrderBy } from './models/priorityLevelSortCriteria';
import { PriorityScenario } from './models/priorityScenario';
import { ProjectRank } from './models/projectRank';

class ProgramBookPriorityScenarioService {
  public getProgramBookPriorityScenario(
    programBook: IEnrichedProgramBook,
    priorityScenario: IPriorityScenario
  ): IPriorityScenario {
    return programBook.priorityScenarios.find(p => p.id === priorityScenario.id) || null;
  }

  public updateProgramBookWithPriorityScenario(programBook: IEnrichedProgramBook, priorityScenario: IPriorityScenario) {
    const priorityScenarios = programBook.priorityScenarios;
    const found: IPriorityScenario = priorityScenarios?.find(p => p?.id === priorityScenario?.id);
    if (!found) {
      priorityScenarios.push(priorityScenario);
    } else {
      Object.assign(found, priorityScenario);
    }
    programBook.priorityScenarios = priorityScenarios;
  }

  public appendProjectToOrderedProjects(priorityScenario: PriorityScenario, projectId: string) {
    const lastOrderedProject = !isEmptyLodash(priorityScenario.orderedProjects)
      ? maxBy(priorityScenario.orderedProjects, 'rank')
      : null;
    const nextRank = lastOrderedProject?.rank + 1 || 1;
    priorityScenario.orderedProjects.push(this.generateOrderedProject(0, projectId, nextRank));
  }

  // TODO
  // ------------------------------------- TO BE REWRITTEN ---------------------///
  // ------------------------------------- SHOULD BE DONE BY PRIOROTY SCENARIO DOMAIN CLASS ---------------------///
  public async updatePriorityLevelsCount(
    priorityLevels: PlainPriorityLevel<IPlainPriorityLevelProps>[],
    projects: IEnrichedProject[],
    annualPeriodYear: number,
    programBook: ProgramBook
  ): Promise<Result<PriorityLevel>[]> {
    let results: Result<PriorityLevel>[] = [];
    const totalCount = projects?.length || 0;
    if (totalCount === 0) {
      results = priorityLevels.map(plainlevel =>
        PriorityLevel.create({
          rank: plainlevel.rank,
          criteria: plainlevel.criteria, // MAYBE citeria.create(criteria.props)
          projectCount: totalCount,
          isSystemDefined: plainlevel.rank === 1, // TODO REMOVE
          sortCriterias: plainlevel.sortCriterias
        })
      );
    } else {
      const allProjectsToFilter = cloneDeep(projects);
      results = await this.getStagedPriorityLevelResults(
        priorityLevels,
        allProjectsToFilter,
        annualPeriodYear,
        programBook
      );
    }
    return results;
  }

  private async filterProjectsByPriorityLevelCriteria(
    plainPriorityLevel: PlainPriorityLevel<IPlainPriorityLevelProps>,
    projects: IEnrichedProject[],
    annualPeriodYear: number,
    programBook?: ProgramBook
  ): Promise<IEnrichedProject[]> {
    const results: IEnrichedProject[] = [];
    for (const project of projects) {
      const annualPeriod = project.annualDistribution.annualPeriods.find(ap => ap.year === annualPeriodYear);
      let annualPeriodInstance: ProjectAnnualPeriod;
      if (annualPeriod) {
        annualPeriodInstance = await ProjectAnnualPeriod.fromEnrichedToInstance(annualPeriod, programBook);
      }
      if (
        this.isValidProjectCriteria(plainPriorityLevel, project, annualPeriodInstance) &&
        this.isValidInterventionsCriteria(plainPriorityLevel, project, annualPeriod.year)
      ) {
        results.push(project);
      }
    }
    return results;
  }

  private isValidProjectCriteria(
    plainPriorityLevel: PlainPriorityLevel<IPlainPriorityLevelProps>,
    project: IEnrichedProject,
    annualPeriodInstance: ProjectAnnualPeriod
  ): boolean {
    return (
      this.hasAnnualPeriodProjectCategoryAndSubCategoryCriteria(plainPriorityLevel, project, annualPeriodInstance) &&
      this.hasServicePrioritiesCriteria(plainPriorityLevel, project)
    );
  }

  private isValidInterventionsCriteria(
    plainPriorityLevel: PlainPriorityLevel<IPlainPriorityLevelProps>,
    project: IEnrichedProject,
    year: number
  ): boolean {
    const interventions = project.interventions?.filter(
      i =>
        isEmpty(plainPriorityLevel.criteria.interventionType) ||
        (plainPriorityLevel.criteria.interventionType.includes(i.interventionTypeId) &&
          this.isInterventionMatchYear(i, year))
    );

    return (
      isEmpty(project.interventions) ||
      (!isEmpty(interventions) &&
        this.hasInterventionsAssetsCriteria(plainPriorityLevel, interventions) &&
        this.hasInterventionsCriteria(plainPriorityLevel, interventions, 'requestorId', 'requestorId') &&
        this.hasInterventionsCriteria(plainPriorityLevel, interventions, 'workTypeId', 'workTypeId'))
    );
  }

  private hasServicePrioritiesCriteria(
    plainPriorityLevel: PlainPriorityLevel<IPlainPriorityLevelProps>,
    project: IEnrichedProject
  ) {
    return (
      isEmpty(plainPriorityLevel.criteria.servicePriorities) ||
      plainPriorityLevel.criteria.servicePriorities?.some(servicePriority =>
        project.servicePriorities?.some(
          sp => sp.priorityId === servicePriority.priorityId && sp.service === servicePriority.service
        )
      )
    );
  }

  private hasAnnualPeriodProjectCategoryAndSubCategoryCriteria(
    plainPriorityLevel: PlainPriorityLevel<IPlainPriorityLevelProps>,
    project: IEnrichedProject,
    annualPeriod: ProjectAnnualPeriod
  ) {
    return (
      isEmpty(plainPriorityLevel.criteria.projectCategory) ||
      plainPriorityLevel.criteria.projectCategory?.some(
        projectCategory =>
          (isNil(projectCategory.subCategory) || project.subCategoryIds?.includes(projectCategory.subCategory)) &&
          annualPeriod?.categoryId === projectCategory.category
      )
    );
  }

  private hasInterventionsCriteria(
    plainPriorityLevel: PlainPriorityLevel<IPlainPriorityLevelProps>,
    interventions: IEnrichedIntervention[],
    criteriaProp: string,
    interventionProp: string
  ): boolean {
    return (
      isEmpty(plainPriorityLevel.criteria[criteriaProp]) ||
      interventions.some(intervention =>
        plainPriorityLevel.criteria[criteriaProp].includes(intervention[interventionProp])
      )
    );
  }

  private isInterventionMatchYear(intervention: IEnrichedIntervention, year: number): boolean {
    return intervention.planificationYear === year;
  }

  private hasInterventionsAssetsCriteria(
    plainPriorityLevel: PlainPriorityLevel<IPlainPriorityLevelProps>,
    interventions: IEnrichedIntervention[]
  ): boolean {
    return (
      isEmpty(plainPriorityLevel.criteria.assetTypeId) ||
      interventions.some(intervention => {
        const interventionAssetTypes = uniq(intervention?.assets?.map(el => el.typeId)) || [];
        interventionAssetTypes.some(el => plainPriorityLevel.criteria.assetTypeId.includes(el));
      })
    );
  }

  public async getPriorityScenarioOrderedProjects(
    priorityScenario: PriorityScenario,
    projects: IEnrichedProject[],
    annualPeriodYear: number,
    orderedProjectsWithObjectiveCalculations: IOrderedProject[],
    objectives: Objective[]
  ): Promise<OrderedProject[]> {
    if (!projects) {
      return [];
    }

    const initialRank = 0;
    const allProjectsToFilter = await this.sortStageProjects(
      projects,
      priorityScenario.priorityLevels[0].sortCriterias,
      orderedProjectsWithObjectiveCalculations,
      objectives
    );

    // TODO: Uncomment when we know what property to use to regroup
    // const originalProjectsToFilter = _.cloneDeep(allProjectsToFilter);
    let items: OrderedProject[] = [];
    for (const priorityLevel of priorityScenario.priorityLevels) {
      let stageProjects = await this.filterProjectsByPriorityLevelCriteria(
        priorityLevel,
        allProjectsToFilter,
        annualPeriodYear
      );

      if (!isEmptyLodash(stageProjects)) {
        stageProjects = await this.sortStageProjects(
          stageProjects,
          priorityLevel.sortCriterias,
          orderedProjectsWithObjectiveCalculations,
          objectives
        );

        const orderedProjects = stageProjects.map(stageProject => {
          return this.generateOrderedProject(priorityLevel.rank, stageProject.id, initialRank);
        });

        for (const orderedProject of orderedProjects) {
          if (!items.find(item => item.projectId === orderedProject.projectId)) {
            items.push(orderedProject);
            remove(allProjectsToFilter, projectToFilter => projectToFilter.id === orderedProject.projectId);
          }
        }
      }
    }
    items = [...items, ...this.appendNoStageOrderedProjects(allProjectsToFilter)];

    items = this.setOrderedProjectsRank(items);
    return items;
  }

  public async sortStageProjects(
    stageProjects: IEnrichedProject[],
    sortCriterias: IPriorityLevelSortCriteria[],
    orderedProjects: IOrderedProject[],
    objectives: Objective[]
  ): Promise<IEnrichedProject[]> {
    if (!sortCriterias) {
      return stageProjects;
    }
    const roadNetworkTypes = await taxonomyService.getGroup(TaxonomyGroup.roadNetworkType);
    const numberOfContributionsToThresholdByProject = this.getNumberOfContributionsToThresholdByProject(
      orderedProjects,
      objectives
    );
    const orders: OrderBy[] = [];
    const iteratees = this.getIterateesAndPushOrders(
      sortCriterias,
      orders,
      roadNetworkTypes,
      numberOfContributionsToThresholdByProject
    );
    return orderBy(stageProjects, iteratees, orders);
  }

  private getIterateesAndPushOrders(
    sortCriterias: IPriorityLevelSortCriteria[],
    orders: OrderBy[],
    roadNetworkTypes: ITaxonomy[],
    numberOfContributionsToThresholdByProject: { numberOfContributions: number; id: string }[]
  ) {
    return sortCriterias.map(sortCriteria => {
      switch (sortCriteria.name) {
        case ProgramBookPriorityLevelSort.PROJECT_BUDGET:
          orders.push(OrderBy.DESC);
          return 'globalBudget.allowance';
        case ProgramBookPriorityLevelSort.PROJECT_ID:
          orders.push(OrderBy.ASC);
          return 'id';
        case ProgramBookPriorityLevelSort.ROAD_NETWORK_TYPE:
          orders.push(OrderBy.ASC);
          return (project: IEnrichedProject) =>
            roadNetworkTypes?.find(rn => rn.code === project.roadNetworkTypeId)?.displayOrder;
        case ProgramBookPriorityLevelSort.SERVICE_PRIORITY:
          orders.push(OrderBy.ASC);
          return (project: IEnrichedProject) =>
            project.servicePriorities?.find(sp => sp.service === sortCriteria.service)?.priorityId;
        case ProgramBookPriorityLevelSort.NUMBER_OF_INTERVENTIONS_PER_PROJECT:
          orders.push(OrderBy.DESC);
          return (project: IEnrichedProject) => project.interventionIds.length;
        case ProgramBookPriorityLevelSort.NUMBER_OF_CONTRIBUTIONS_TO_THRESHOLD:
          orders.push(OrderBy.DESC);
          return (project: IEnrichedProject) =>
            numberOfContributionsToThresholdByProject?.find(n => n.id === project.id)?.numberOfContributions;
        default:
          return undefined;
      }
    });
  }

  private getNumberOfContributionsToThresholdByProject(
    orderedProjects: IOrderedProject[],
    objectives: Objective[]
  ): { numberOfContributions: number; id: string }[] {
    const numberOfContributionsToThresholdByProject = [];
    const thresholdObjectives = objectives.filter(o => o.objectiveType === ProgramBookObjectiveType.threshold);
    for (const [i, orderedProject] of orderedProjects.entries()) {
      let numberOfContributions = 0;
      for (const objective of thresholdObjectives) {
        const previousObjectiveCalculation = orderedProjects[i - 1]?.objectivesCalculation.find(
          oc => oc.objectiveId === objective.id
        );
        const objectiveCalculation = orderedProject.objectivesCalculation.find(oc => oc.objectiveId === objective.id);
        if (objectiveCalculation.objectiveSum > (previousObjectiveCalculation?.objectiveSum || 0)) {
          numberOfContributions = numberOfContributions + 1;
        }
      }
      numberOfContributionsToThresholdByProject.push({
        numberOfContributions: cloneDeep(numberOfContributions),
        id: orderedProject.projectId
      });
    }
    return numberOfContributionsToThresholdByProject;
  }

  public generateOrderedProject(levelRank: number, projectId: string, initialRank: number): OrderedProject {
    const result = OrderedProject.create({
      projectId,
      levelRank,
      initialRank,
      rank: initialRank,
      isManuallyOrdered: false,
      audit: Audit.fromCreateContext()
    });
    return result.getValue();
  }

  private appendNoStageOrderedProjects(allProjectsToFilter: IEnrichedProject[]): OrderedProject[] {
    return allProjectsToFilter.map(unstageProject => this.generateOrderedProject(0, unstageProject.id, 0));
  }

  private setOrderedProjectsRank(orderedProjects: OrderedProject[]): OrderedProject[] {
    return orderedProjects.map((op, index) => {
      const rank = index + 1;
      return OrderedProject.create({
        projectId: op.projectId,
        levelRank: op.levelRank,
        initialRank: rank,
        rank,
        isManuallyOrdered: op.isManuallyOrdered,
        audit: Audit.fromCreateContext()
      }).getValue();
    });
  }

  public updateOrderedProjectsWithNewProjectRank(
    orderedProjects: OrderedProject[],
    orderedProjectToUpdate: OrderedProject,
    projectRank: ProjectRank
  ): OrderedProject[] {
    const rankToReach = !projectRank.isManuallyOrdered ? orderedProjectToUpdate.initialRank : projectRank.newRank;
    const rankFrom = orderedProjectToUpdate.rank;
    const delta = rankFrom - rankToReach;
    remove(orderedProjects, p => p.projectId === orderedProjectToUpdate.projectId);
    this.swapOthersPrecalculatedSystemRanks(orderedProjects, orderedProjectToUpdate, projectRank, delta);

    orderedProjects.push(
      OrderedProject.create({
        projectId: orderedProjectToUpdate.projectId,
        levelRank: orderedProjectToUpdate.levelRank,
        initialRank: orderedProjectToUpdate.initialRank,
        rank: rankToReach,
        isManuallyOrdered: projectRank.isManuallyOrdered,
        note: projectRank.note || orderedProjectToUpdate.note,
        audit: Audit.fromUpdateContext(orderedProjectToUpdate.audit)
      }).getValue()
    );
    return sortBy(orderedProjects, ['rank']);
  }

  private setNewRank(incrementalRank: number, immutableRanks: number[], isPositiveDelta: boolean): number {
    let newRank = incrementalRank;
    if (immutableRanks.includes(incrementalRank)) {
      newRank += isPositiveDelta ? 1 : -1;
      this.setNewRank(newRank, immutableRanks, isPositiveDelta);
    }
    return newRank;
  }

  private swapOthersPrecalculatedSystemRanks(
    orderedProjects: OrderedProject[],
    orderedProjectToUpdate: OrderedProject,
    projectRank: ProjectRank,
    delta: number
  ) {
    const orderedProjectToUpdateRank = orderedProjectToUpdate.rank;
    const newRank = !projectRank.isManuallyOrdered ? orderedProjectToUpdate.initialRank : projectRank.newRank;
    const isPositiveDelta = delta > 0 ? true : false;
    const rankIncremental = isPositiveDelta ? 1 : -1;
    const affectedOrderedProjects = orderedProjects.filter(
      op =>
        (op.rank < orderedProjectToUpdateRank && op.rank >= newRank && isPositiveDelta) ||
        (op.rank > orderedProjectToUpdateRank && op.rank <= newRank && !isPositiveDelta)
    );

    const immutableRanks = affectedOrderedProjects
      .map(aop => {
        if (aop.isManuallyOrdered) {
          return aop.rank;
        }
        return null;
      })
      .filter(x => x);

    affectedOrderedProjects.forEach(aop => {
      if (aop.isManuallyOrdered) {
        return;
      }
      const incrementalRank = aop.rank + rankIncremental;
      aop.rank = this.setNewRank(incrementalRank, immutableRanks, isPositiveDelta);
    });
  }

  private async getStagedPriorityLevelResults(
    priorityLevels: PlainPriorityLevel<IPlainPriorityLevelProps>[],
    projects: IEnrichedProject[],
    annualPeriodYear: number,
    programBook: ProgramBook
  ): Promise<Result<PriorityLevel>[]> {
    const results: Result<PriorityLevel>[] = [];
    const items: IOrderedProject[] = [];
    let initialRank = 1;
    for (const priorityLevel of priorityLevels) {
      let stageCount = 0;
      const stageProjects = await this.filterProjectsByPriorityLevelCriteria(
        priorityLevel,
        projects,
        annualPeriodYear,
        programBook
      );
      if (!isEmptyLodash(stageProjects)) {
        const orderedProjects = stageProjects.map(stageProject =>
          this.generateOrderedProject(priorityLevel.rank, stageProject.id, initialRank++)
        );
        for (const orderedProject of orderedProjects) {
          if (!items.find(item => item.projectId === orderedProject.projectId)) {
            items.push(orderedProject);
            remove(projects, projectToFilter => projectToFilter.id === orderedProject.projectId);
            stageCount++;
          }
        }
      }
      results.push(
        PriorityLevel.create({
          rank: priorityLevel.rank,
          criteria: priorityLevel.criteria, // MAYBE citeria.create(criteria.props)
          projectCount: stageCount,
          isSystemDefined: priorityLevel.rank === 1, // TODO REMOVE ISSYSTEMDEFINED
          sortCriterias: priorityLevel.sortCriterias
        })
      );
    }
    return results;
  }

  // ------------------------------------- TO BE REWRITTEN ---------------------///

  public outdateProgramBooksPriorityScenarios(programBooks: ProgramBook[]): void {
    for (const programBook of programBooks) {
      this.outdateProgramBookPriorityScenarios(programBook);
    }
  }

  public outdateProgramBookPriorityScenarios(programBook: ProgramBook): void {
    for (const priorityScenario of programBook.priorityScenarios) {
      priorityScenario.outDate();
    }
  }
}

export const programBookPriorityScenarioService = new ProgramBookPriorityScenarioService();
