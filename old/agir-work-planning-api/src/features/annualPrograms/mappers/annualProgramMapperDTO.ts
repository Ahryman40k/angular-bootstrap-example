import {
  AnnualProgramExpand,
  IAudit,
  IEnrichedAnnualProgram,
  IEnrichedProgramBook,
  Permission,
  Role
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { isEmpty, pick } from 'lodash';
import { userService } from '../../../services/userService';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { programBookMapperDTO } from '../../programBooks/mappers/programBookMapperDTO';
import { AnnualProgram } from '../models/annualProgram';

export interface IAnnualProgramMapperDTOOptions {
  fields: string[];
}

class AnnualProgramMapperDTO extends FromModelToDtoMappings<
  AnnualProgram,
  IEnrichedAnnualProgram,
  IAnnualProgramMapperDTOOptions
> {
  protected async getFromNotNullModel(
    annualProgram: AnnualProgram,
    options: IAnnualProgramMapperDTOOptions
  ): Promise<IEnrichedAnnualProgram> {
    const [programBooksDTO, auditDTO] = await Promise.all([
      programBookMapperDTO.getFromModels(annualProgram.programBooks, {
        hasAnnualProgram: false,
        fields: this.getOptionsNestedFields(options?.fields, AnnualProgramExpand.programBooks)
      }),
      auditMapperDTO.getFromModel(annualProgram.audit)
    ]);
    return this.map(annualProgram, programBooksDTO, auditDTO, options);
  }

  private map(
    annualProgram: AnnualProgram,
    programBooksDTO: IEnrichedProgramBook[],
    auditDTO: IAudit,
    options: IAnnualProgramMapperDTOOptions
  ): IEnrichedAnnualProgram {
    let mappedAnnualProgram: IEnrichedAnnualProgram = {
      id: annualProgram.id,
      executorId: annualProgram.executorId,
      year: annualProgram.year,
      description: annualProgram.description,
      budgetCap: annualProgram.budgetCap,
      status: annualProgram.status,
      sharedRoles: annualProgram.sharedRoles,
      programBooks: programBooksDTO,
      limitedAccess: annualProgram.limitedAccess,
      audit: auditDTO
    };
    mappedAnnualProgram = this.mapWithPermissions(mappedAnnualProgram);
    if (!isEmpty(options?.fields)) {
      return pick(mappedAnnualProgram, [
        'id',
        ...options.fields,
        ...this.getOptionsNestedFields(options.fields, AnnualProgramExpand.programBooks, true)
      ]) as IEnrichedAnnualProgram;
    }
    return mappedAnnualProgram;
  }

  private mapWithPermissions(annualProgramDTO: IEnrichedAnnualProgram): IEnrichedAnnualProgram {
    if (!userService.currentUser.hasPermission(Permission.ANNUAL_PROGRAM_READ_ALL)) {
      delete annualProgramDTO.budgetCap;
      delete annualProgramDTO.sharedRoles;

      if (!annualProgramDTO.sharedRoles?.some(sr => userService.currentUser.roles.includes(sr as Role))) {
        delete annualProgramDTO.audit;
        delete annualProgramDTO.description;
        annualProgramDTO.limitedAccess = true;
      }
    }
    return annualProgramDTO;
  }
}

export const annualProgramMapperDTO = new AnnualProgramMapperDTO();
