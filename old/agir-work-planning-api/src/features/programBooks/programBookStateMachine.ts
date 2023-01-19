import {
  ProgramBookStatus,
  ProjectStatus,
  Role,
  ShareableRole,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';

import { Result } from '../../shared/logic/result';
import { StateMachineRunnable } from '../../shared/stateMachine/stateMachineRunnable';
import { ITransition } from '../../shared/stateMachine/transition';
import { enumValues } from '../../utils/enumUtils';
import { annualProgramService } from '../annualPrograms/annualProgramService';
import { ProjectFindOptions } from '../projects/models/projectFindOptions';
import { projectRepository } from '../projects/mongo/projectRepository';
import { taxonomyService } from '../taxonomies/taxonomyService';
import { ProgramBook } from './models/programBook';

// tslint:disable:no-empty-interface
interface IProgramBookStateMachineOptions {}

export class ProgramBookStateMachine extends StateMachineRunnable<
  ProgramBook,
  IProgramBookStateMachineOptions,
  ProgramBook
> {
  public readonly transitions: ITransition<ProgramBook, IProgramBookStateMachineOptions, ProgramBook>[] = [
    {
      from: ProgramBookStatus.new,
      to: ProgramBookStatus.programming,
      run: async (programBook: ProgramBook, target: ProgramBookStatus) => {
        if (programBook?.annualProgram?.sharedRoles) {
          programBook.setSharedRoles(programBook.annualProgram.sharedRoles);
        }
        programBook.setStatus(target);
        await annualProgramService.updateStatusWithProgramBook(programBook.annualProgram, programBook);
        return Result.ok(programBook);
      }
    },
    {
      from: ProgramBookStatus.programming,
      to: ProgramBookStatus.submittedPreliminary,
      run: async (programBook: ProgramBook, target: ProgramBookStatus) => {
        programBook.setStatus(target);
        return this.updateAllProjectsStatusFromTo(
          programBook,
          ProjectStatus.programmed,
          ProjectStatus.preliminaryOrdered
        );
      }
    },
    {
      from: ProgramBookStatus.submittedPreliminary,
      to: ProgramBookStatus.programming,
      run: async (programBook: ProgramBook, target: ProgramBookStatus) => {
        programBook.setStatus(target);
        return this.updateAllProjectsStatusFromTo(
          programBook,
          ProjectStatus.preliminaryOrdered,
          ProjectStatus.programmed
        );
      }
    },
    {
      from: ProgramBookStatus.submittedPreliminary,
      to: ProgramBookStatus.submittedFinal,
      run: async (programBook: ProgramBook, target: ProgramBookStatus) => {
        const roles = await taxonomyService.getTaxonomyValueString<Role>(
          TaxonomyGroup.shareableRole,
          ShareableRole.programBook
        );
        programBook.setStatus(target);
        programBook.setSharedRoles(roles);
        return this.updateAllProjectsStatusFromTo(
          programBook,
          enumValues<ProjectStatus>(ProjectStatus).filter(ps => ps !== ProjectStatus.finalOrdered),
          ProjectStatus.finalOrdered
        );
      }
    }
  ];

  private async updateAllProjectsStatusFromTo(
    programBook: ProgramBook,
    from: ProjectStatus[] | ProjectStatus,
    to: ProjectStatus
  ): Promise<Result<ProgramBook>> {
    const findProjectsOptions = ProjectFindOptions.create({
      criterias: {
        programBookId: programBook.id,
        status: from
      }
    }).getValue();
    const foundProjects = await projectRepository.findAll(findProjectsOptions);
    if (!isEmpty(foundProjects)) {
      const updatedProject = foundProjects.map(project => {
        project.status = to;
        return project;
      });
      const result = await projectRepository.saveBulk(updatedProject);
      programBook.setProjects(updatedProject);
      if (result.isFailure) {
        return Result.fail(result.errorValue);
      }
    }
    return Result.ok(programBook);
  }
}

export const programBookStateMachine = new ProgramBookStateMachine();
