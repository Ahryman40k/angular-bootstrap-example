import {
  IAudit,
  IObjectiveCalculation,
  IOrderedProject,
  IOrderedProjectsPaginatedSearchRequest
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { UnexpectedError } from '../../../shared/domainErrors/unexpectedError';
import { Result } from '../../../shared/logic/result';
import { FromModelToDtoMappings, IMapperOptions } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { Objective } from '../../programBooks/models/objective';
import { ProgramBook } from '../../programBooks/models/programBook';
import { OrderedProject } from '../models/orderedProject';

// tslint:disable:no-empty-interface
export interface IOrderedProjectMapperOptions extends IOrderedProjectsPaginatedSearchRequest, IMapperOptions {
  programBook?: ProgramBook;
  previousOrderedProjectObjectivesCalculation?: IObjectiveCalculation[];
  objectivesCalculation?: boolean;
}
class OrderedProjectMapperDTO extends FromModelToDtoMappings<
  OrderedProject,
  IOrderedProject,
  IOrderedProjectMapperOptions
> {
  protected async getFromNotNullModel(
    orderedProject: OrderedProject,
    options: IOrderedProjectMapperOptions
  ): Promise<IOrderedProject> {
    const auditDTO = await auditMapperDTO.getFromModel(orderedProject.audit);
    return this.map(orderedProject, auditDTO, options);
  }

  private map(
    orderedProject: OrderedProject,
    auditDTO: IAudit,
    options: IOrderedProjectMapperOptions
  ): IOrderedProject {
    let objectivesCalculation: IObjectiveCalculation[];
    if (options?.objectivesCalculation) {
      objectivesCalculation = this.getObjectivesCalculation(
        orderedProject,
        options.programBook,
        options.previousOrderedProjectObjectivesCalculation
      );
    }
    return {
      projectId: orderedProject.projectId,
      levelRank: orderedProject.levelRank,
      initialRank: orderedProject.initialRank,
      rank: orderedProject.rank,
      isManuallyOrdered: orderedProject.isManuallyOrdered,
      note: orderedProject.note,
      objectivesCalculation,
      audit: auditDTO
    };
  }

  private getObjectivesCalculation(
    orderedProject: OrderedProject,
    programBook: ProgramBook,
    previousObjectivesCalculation: IObjectiveCalculation[]
  ): IObjectiveCalculation[] {
    if (isEmpty(programBook.projects)) {
      return undefined;
    }
    return programBook.objectives.map(objective => {
      const previousCalculation = this.getPreviousObjectiveCalculation(previousObjectivesCalculation, objective);
      return this.sumObjectiveCalculation(orderedProject, previousCalculation, objective, programBook);
    });
  }

  private sumObjectiveCalculation(
    orderedProject: OrderedProject,
    previousCalculation: IObjectiveCalculation,
    objective: Objective,
    programBook: ProgramBook
  ): IObjectiveCalculation {
    const programBookProject = programBook.projects.find(proj => proj.id === orderedProject.projectId);
    const calculatedValueResult = objective.calculateValue(
      programBookProject.interventions,
      programBook.annualProgram.year,
      programBook.getProjectsAdditionalCosts([programBookProject])
    );
    if (calculatedValueResult.isFailure) {
      throw new UnexpectedError(Result.combineForError(calculatedValueResult));
    }
    const objectiveSum = previousCalculation.objectiveSum + calculatedValueResult.getValue();
    return {
      objectiveId: objective.id,
      objectiveSum,
      objectivePercent: Math.round((objectiveSum / objective.values.reference) * 100)
    };
  }

  private getPreviousObjectiveCalculation(
    previousObjectivesCalculation: IObjectiveCalculation[],
    objective: Objective
  ) {
    let previousCalculation = previousObjectivesCalculation?.find(previous => previous.objectiveId === objective.id);
    if (!previousCalculation) {
      previousCalculation = {
        objectiveId: objective.id,
        objectiveSum: 0,
        objectivePercent: 0
      };
    }
    return previousCalculation;
  }
}
export const orderedProjectMapperDTO = new OrderedProjectMapperDTO();
