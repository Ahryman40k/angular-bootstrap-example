import * as MongoDb from 'mongodb';

import { IEnrichedProgramBook, IOrderedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../../config/constants';
import { IAuditAttributes } from '../../../../features/audit/mongo/auditSchema';
import { systemUser } from '../../../../services/auditService';
import { createLogger } from '../../../../utils/logger';
import { MomentUtils } from '../../../../utils/moment/momentUtils';

const logger = createLogger('mongo/2.5.3');
let programBooksCollectionDB: MongoDb.Collection<any>;

export default async function update(db: MongoDb.Db): Promise<void> {
  programBooksCollectionDB = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  const programBooks = await getAllProgramBooks();
  if (programBooks?.length) {
    await addAuditToOrderedProjectsPriorityScenarios(programBooksCollectionDB, programBooks);
  }
}

async function addAuditToOrderedProjectsPriorityScenarios(
  programBooksCollection: MongoDb.Collection,
  programBooks: IEnrichedProgramBook[]
): Promise<void> {
  let err = '';
  let count = 0;
  const audit: IAuditAttributes = {
    createdAt: MomentUtils.now().toISOString(),
    createdBy: {
      userName: systemUser.userName,
      displayName: systemUser.displayName
    }
  };

  for (const programBook of programBooks) {
    try {
      let savePBInBd = false;
      programBook.priorityScenarios = programBook.priorityScenarios.map(ps => {
        ps.orderedProjects = (ps as any).orderedProjects.map((op: IOrderedProject) => {
          savePBInBd = true;
          return {
            ...op,
            audit
          };
        });
        return ps;
      });

      if (savePBInBd) {
        count += await persistProgramBook(programBooksCollection, programBook);
      }
    } catch (e) {
      err = `${err}\nError -> ${programBook.id}: ${e}`;
    }
  }
  if (err) {
    logger.info(`${err}`);
  }
  logger.info(`Adding default priority scenario in programBooks ( ${count} / ${programBooks.length} )`);
}

async function getAllProgramBooks(): Promise<IEnrichedProgramBook[]> {
  const programBooks = await programBooksCollectionDB.find().toArray();
  return programBooks;
}

async function persistProgramBook(
  programBooksCollection: MongoDb.Collection,
  programBook: IEnrichedProgramBook
): Promise<number> {
  try {
    await programBooksCollection.update(
      { _id: (programBook as any)._id },
      {
        $set: {
          priorityScenarios: programBook.priorityScenarios
        }
      }
    );
  } catch (e) {
    return 0;
  }
  return 1;
}
