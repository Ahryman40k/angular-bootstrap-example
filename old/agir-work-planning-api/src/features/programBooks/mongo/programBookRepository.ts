import { IEnrichedProject, ProgramBookExpand, ProjectExpand } from '@villemontreal/agir-work-planning-lib';
import { isEmpty } from 'lodash';

import { BaseRepository } from '../../../repositories/core/baseRepository';
import { Result } from '../../../shared/logic/result';
import { AnnualProgram } from '../../annualPrograms/models/annualProgram';
import { annualProgramRepository } from '../../annualPrograms/mongo/annualProgramRepository';
import { Audit } from '../../audit/audit';
import { PriorityScenario, PRIORITYSCENARIOS_MANDATORY_FIELDS } from '../../priorityScenarios/models/priorityScenario';
import { ProjectFindOptions } from '../../projects/models/projectFindOptions';
import { projectRepository } from '../../projects/mongo/projectRepository';
import { IProgramBookRepository } from '../iProgramBookRepository';
import { Objective } from '../models/objective';
import { IProgramBookProps, ProgramBook } from '../models/programBook';
import { IProgramBookCriterias, ProgramBookFindOptions } from '../models/programBookFindOptions';
import { programBookMatchBuilder } from '../programBookMatchBuilder';
import { IProgramBookMongoDocument, ProgramBookModel } from './programBookModel';
import { IProgramBookMongoAttributes } from './programBookSchema';

export const PROGRAMBOOK_MANDATORY_FIELDS = [
  '_id',
  'annualProgramId',
  'projectTypes',
  'name',
  'audit',
  ...PRIORITYSCENARIOS_MANDATORY_FIELDS.map(field => `priorityScenarios.${field}`)
];
/**
 * Program book repository, based on Mongo/Mongoose.
 */
class ProgramBookRepository extends BaseRepository<ProgramBook, IProgramBookMongoDocument, ProgramBookFindOptions>
  implements IProgramBookRepository {
  public get model(): ProgramBookModel {
    return this.db.models.ProgramBook;
  }

  protected async getMatchFromQueryParams(criterias: IProgramBookCriterias): Promise<any> {
    return programBookMatchBuilder.getMatchFromQueryParams(criterias);
  }

  // TODO think about
  // Cascading save PRESAVE or POSTSAVE
  protected async preSave(programBook: ProgramBook): Promise<Result<any>> {
    return annualProgramRepository.save(programBook.annualProgram);
  }

  // TODO ADD AN OPTION TO CHOOSE EXPAND
  public async toDomainModel(raw: IProgramBookMongoAttributes, expand: string[] = []): Promise<ProgramBook> {
    let annualProgram: AnnualProgram;
    // The none expand is used to avoid errors in migrations files that cannot use instanciated models
    if (!expand.includes('none')) {
      annualProgram = await annualProgramRepository.findById(raw.annualProgramId);
    }

    let projects: IEnrichedProject[] = [];
    if (expand.includes(ProgramBookExpand.projects) || expand.includes(ProgramBookExpand.projectsInterventions)) {
      projects = await projectRepository.findAll(
        ProjectFindOptions.create({
          criterias: {
            programBookId: raw._id
          },
          expand: [...expand, ProjectExpand.interventions].join(',')
        }).getValue()
      );
    }

    let removedProjects: IEnrichedProject[] = [];
    if (!isEmpty(raw.removedProjectsIds)) {
      if (expand.includes(ProgramBookExpand.removedProjects)) {
        removedProjects = await projectRepository.findAll(
          ProjectFindOptions.create({
            criterias: {
              id: raw.removedProjectsIds
            }
          }).getValue()
        );
      } else {
        removedProjects = raw.removedProjectsIds.map(id => ({ id } as IEnrichedProject));
      }
    }

    let priorityScenarios: PriorityScenario[] = [];
    if (!isEmpty(raw.priorityScenarios)) {
      priorityScenarios = await Promise.all(
        raw.priorityScenarios.map(scenario => {
          return PriorityScenario.toDomainModel(scenario);
        })
      );
    }

    let objectives: Objective[] = [];
    if (!isEmpty(raw.objectives)) {
      objectives = await Promise.all(
        raw.objectives.map(objective => {
          return Objective.toDomainModel(objective);
        })
      );
    }

    const programBookProps: IProgramBookProps = {
      name: raw.name,
      projectTypes: raw.projectTypes,
      inCharge: raw.inCharge,
      boroughIds: raw.boroughIds,
      sharedRoles: raw.sharedRoles,
      status: raw.status,
      annualProgram,
      objectives,
      projects,
      removedProjects,
      priorityScenarios,
      programTypes: raw.programTypes,
      description: raw.description,
      isAutomaticLoadingInProgress: raw.isAutomaticLoadingInProgress,
      audit: await Audit.toDomainModel(raw.audit)
    };
    return ProgramBook.create(programBookProps, raw._id.toString()).getValue();
  }

  protected toPersistence(programBook: ProgramBook): IProgramBookMongoAttributes {
    return {
      _id: programBook.id,
      name: programBook.name,
      annualProgramId: programBook.annualProgram?.id,
      projectTypes: programBook.projectTypes,
      boroughIds: programBook.boroughIds,
      removedProjectsIds: programBook.removedProjects.map(project => project.id),
      inCharge: programBook.inCharge,
      status: programBook.status,
      priorityScenarios: programBook.priorityScenarios.map(scenario => PriorityScenario.toPersistence(scenario)),
      objectives: programBook.objectives.map(objective => Objective.toPersistence(objective)),
      sharedRoles: programBook.sharedRoles,
      audit: Audit.toPersistance(programBook.audit),
      programTypes: programBook.programTypes,
      description: programBook.description,
      isAutomaticLoadingInProgress: programBook.isAutomaticLoadingInProgress
    };
  }

  protected getProjection(fields: string[]): any {
    return super.getProjection(fields, PROGRAMBOOK_MANDATORY_FIELDS);
  }
}

export const programBookRepository: IProgramBookRepository = new ProgramBookRepository();
