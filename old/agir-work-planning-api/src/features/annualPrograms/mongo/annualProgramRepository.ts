import { AnnualProgramExpand } from '@villemontreal/agir-work-planning-lib/dist/src';
import { concat, isEmpty } from 'lodash';

import { BaseRepository } from '../../../repositories/core/baseRepository';
import { Audit } from '../../audit/audit';
import { ProgramBook } from '../../programBooks/models/programBook';
import { PROGRAMBOOK_MANDATORY_FIELDS, programBookRepository } from '../../programBooks/mongo/programBookRepository';
import { annualProgramMatchBuilder } from '../annualProgramMatchBuilder';
import { IAnnualProgramRepository } from '../iAnnualProgramRepository';
import { AnnualProgram, IAnnualProgramProps } from '../models/annualProgram';
import { AnnualProgramFindOptions, IAnnualProgramCriterias } from '../models/annualProgramFindOptions';
import { AnnualProgramModel, IAnnualProgramMongoDocument } from './annualProgramModel';
import { IAnnualProgramMongoAttributes } from './annualProgramSchema';

const ANNUAL_PROGRAM_MANDATORY_FIELDS = ['executorId', 'year'];

/**
 * Annual Program repository, based on Mongo/Mongoose.
 */
class AnnualProgramRepository
  extends BaseRepository<AnnualProgram, IAnnualProgramMongoDocument, AnnualProgramFindOptions>
  implements IAnnualProgramRepository {
  public get model(): AnnualProgramModel {
    return this.db.models.AnnualProgram;
  }

  protected async getMatchFromQueryParams(criterias: IAnnualProgramCriterias): Promise<any> {
    return annualProgramMatchBuilder.getMatchFromQueryParams(criterias);
  }

  protected getSortCorrespondance(): any[] {
    return concat(super.getSortCorrespondance(), { param: 'year', dbName: 'year' });
  }
  protected async toDomainModel(
    raw: IAnnualProgramMongoAttributes,
    expand: AnnualProgramExpand[]
  ): Promise<AnnualProgram> {
    // TODO programbook sorting should be done thrrough aggregate pipeline
    let programBooks: ProgramBook[] = [];
    if (!isEmpty(raw.programBooks) && expand.includes(AnnualProgramExpand.programBooks)) {
      programBooks = await Promise.all(raw.programBooks.map(pb => programBookRepository.toDomainModel(pb)));
    }
    const annualProgramProps: IAnnualProgramProps = {
      executorId: raw.executorId,
      year: raw.year,
      description: raw.description,
      budgetCap: raw.budgetCap,
      sharedRoles: raw.sharedRoles,
      status: raw.status,
      programBooks,
      limitedAccess: raw.limitedAccess,
      audit: await Audit.toDomainModel(raw.audit)
    };
    return AnnualProgram.create(annualProgramProps, raw._id.toString()).getValue();
  }

  protected toPersistence(annualProgram: AnnualProgram): IAnnualProgramMongoAttributes {
    return {
      _id: annualProgram.id,
      executorId: annualProgram.executorId,
      year: annualProgram.year,
      description: annualProgram.description,
      budgetCap: annualProgram.budgetCap,
      sharedRoles: annualProgram.sharedRoles,
      status: annualProgram.status,
      limitedAccess: annualProgram.limitedAccess,
      audit: Audit.toPersistance(annualProgram.audit)
    };
  }

  protected getProjection(fields: string[]): any {
    // Must add programbooks fields in case of expand
    return super.getProjection(fields, [
      ...ANNUAL_PROGRAM_MANDATORY_FIELDS,
      ...PROGRAMBOOK_MANDATORY_FIELDS.map(f => `programBooks.${f}`)
    ]);
  }
}

export const annualProgramRepository: IAnnualProgramRepository = new AnnualProgramRepository();
