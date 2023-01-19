import { chunk, uniq } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { Audit } from '../../../../features/audit/audit';
import { Author } from '../../../../features/audit/author';
import { auditMapperDTO } from '../../../../features/audit/mappers/auditMapperDTO';
import { IInterventionAttributes } from '../../../../features/interventions/mongo/interventionAttributes';
import { IProjectAttributes } from '../../../../features/projects/mongo/projectModel';
import { systemUser } from '../../../../services/auditService';
import { EXECUTOR_DI } from '../../../../shared/taxonomies/constants';
import { createLogger } from '../../../../utils/logger';
import { MomentUtils } from '../../../../utils/moment/momentUtils';

const logger = createLogger('mongo/2.7.43');
let INTERVENTIONS_COLLECTION: Collection;
let PROJECTS_COLLECTION: Collection;

/**
 * For V2.7.43 set intervention executor
 */

export default async function update(db: Db): Promise<void> {
  try {
    const startTime = Date.now();

    INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
    PROJECTS_COLLECTION = db.collection(constants.mongo.collectionNames.PROJECTS);

    const interventions = await INTERVENTIONS_COLLECTION.find({}).toArray();
    const projects = await getProjects(interventions);

    await setInterventionExecutorId(interventions, projects);

    await saveInterventions(interventions);

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.43 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

async function getProjects(interventions: IInterventionAttributes[]): Promise<IProjectAttributes[]> {
  const projectIds = uniq(interventions.map(i => i.project?.id).filter(x => x));
  return PROJECTS_COLLECTION.find({ _id: { $in: projectIds } }).toArray();
}

async function saveInterventions(interventions: IInterventionAttributes[]) {
  const promises = interventions.map(i => INTERVENTIONS_COLLECTION.findOneAndReplace({ _id: i._id }, i));

  for (const chunkPromises of chunk(promises, 10)) {
    await Promise.all(chunkPromises);
  }
}

async function setInterventionExecutorId(
  interventions: IInterventionAttributes[],
  projects: IProjectAttributes[]
): Promise<void> {
  for (const i of interventions) {
    const project = projects.find(p => p._id === i.project?.id);
    i.executorId = project?.executorId || EXECUTOR_DI;
    i.audit = await auditMapperDTO.getFromModel(
      Audit.create({
        createdAt: i.audit.createdAt,
        createdBy: Author.create(i.audit.createdBy).getValue(),
        lastModifiedAt: MomentUtils.now().toISOString(),
        lastModifiedBy: Author.create(systemUser).getValue()
      }).getValue()
    );
  }
}
