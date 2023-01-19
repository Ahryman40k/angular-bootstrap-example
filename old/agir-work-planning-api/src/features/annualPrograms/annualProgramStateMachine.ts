import {
  AnnualProgramStatus,
  ProgramBookStatus,
  Role,
  ShareableRole,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';

import { Result } from '../../shared/logic/result';
import { StateMachineRunnable } from '../../shared/stateMachine/stateMachineRunnable';
import { ITransition } from '../../shared/stateMachine/transition';
import { ProgramBookFindOptions } from '../programBooks/models/programBookFindOptions';
import { programBookRepository } from '../programBooks/mongo/programBookRepository';
import { programBookStateMachine } from '../programBooks/programBookStateMachine';
import { taxonomyService } from '../taxonomies/taxonomyService';
import { AnnualProgram } from './models/annualProgram';

// tslint:disable:no-empty-interface
interface IAnnualProgramStateMachineOptions {}

export class AnnualProgramStateMachine extends StateMachineRunnable<
  AnnualProgram,
  IAnnualProgramStateMachineOptions,
  AnnualProgram
> {
  public readonly transitions: ITransition<AnnualProgram, IAnnualProgramStateMachineOptions, AnnualProgram>[] = [
    {
      from: AnnualProgramStatus.new,
      to: AnnualProgramStatus.programming,
      run: async (source: AnnualProgram, target: AnnualProgramStatus) => {
        source.setStatus(target);
        return Result.ok(source);
      }
    },
    {
      from: AnnualProgramStatus.programming,
      to: AnnualProgramStatus.submittedFinal,
      run: async (source: AnnualProgram, target: AnnualProgramStatus) => {
        const sharedRoles = await taxonomyService.getTaxonomyValueString<Role>(
          TaxonomyGroup.shareableRole,
          ShareableRole.annualProgram
        );
        source.setStatus(target);
        source.setSharedRoles(sharedRoles);
        await this.updateAllProgramBookStatusFromToAndSharedRoles(
          source,
          ProgramBookStatus.submittedPreliminary,
          ProgramBookStatus.submittedFinal
        );
        return Result.ok(source);
      }
    },
    {
      from: AnnualProgramStatus.programming,
      to: AnnualProgramStatus.new,
      run: async (source: AnnualProgram, target: AnnualProgramStatus) => {
        source.setStatus(target);
        return Result.ok(source);
      }
    }
  ];
  private async updateAllProgramBookStatusFromToAndSharedRoles(
    annualProgram: AnnualProgram,
    from: ProgramBookStatus,
    to: ProgramBookStatus
  ): Promise<Result<AnnualProgram>> {
    const findProgramBookOptions = ProgramBookFindOptions.create({
      criterias: {
        annualProgramId: annualProgram.id,
        status: [from]
      }
    }).getValue();
    const foundProgramBooks = await programBookRepository.findAll(findProgramBookOptions);
    if (!isEmpty(foundProgramBooks)) {
      const updatedProgramBooks = await Promise.all(
        foundProgramBooks.map(async programBook => {
          return (await programBookStateMachine.execute(programBook, to)).getValue();
        })
      );
      annualProgram.setProgramBooks(updatedProgramBooks);
      const result = await programBookRepository.saveBulk(updatedProgramBooks);
      if (result.isFailure) {
        return Result.fail(result.errorValue);
      }
    }
    return Result.ok(annualProgram);
  }
}

export const annualProgramStateMachine = new AnnualProgramStateMachine();
