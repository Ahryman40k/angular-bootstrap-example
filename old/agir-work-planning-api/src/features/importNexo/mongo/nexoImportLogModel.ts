import { ModificationType, NexoFileType, NexoImportStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Connection, Document } from 'mongoose';
import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { IImportErrorAttributes } from '../../../shared/import/importErrorSchema';
import { IAuditAttributes } from '../../audit/mongo/auditSchema';
import { INexoImportLogProps } from '../models/nexoImportLog';
import { nexoImportLogSchema } from './nexoImportLogSchema';

export interface INexoImportLogMongoAttributes {
  _id: string;
  status: NexoImportStatus;
  files: INexoImportFileAttributes[];
  audit: IAuditAttributes;
}

export interface INexoFileErrorAttributes extends IImportErrorAttributes {
  line: number;
}

export interface INexoImportFileAttributes {
  id: string;
  name: string;
  contentType: string;
  type: NexoFileType;
  status: NexoImportStatus;
  numberOfItems: number;
  fileErrors: INexoFileErrorAttributes[];
  projects: INexoLogProjectAttributes[];
  interventions: INexoLogInterventionAttributes[];
}

interface INexoLogElementAttributes {
  id: string;
  importStatus: NexoImportStatus;
  modificationType: ModificationType;
  elementErrors: INexoFileErrorAttributes[];
}

// tslint:disable:no-empty-interface
export interface INexoLogProjectAttributes extends INexoLogElementAttributes {}

export interface INexoLogInterventionAttributes extends INexoLogElementAttributes {
  lineNumber: number;
}

export type INexoImportLogMongoDocument = INexoImportLogProps & Document;
export type NexoImportLogModel = CustomModel<INexoImportLogProps>;

export const nexoImportLogModelFactory = (mongoose: Connection) => {
  const nexoImportLogModel = mongoose.model<INexoImportLogMongoDocument>(
    constants.mongo.collectionNames.NEXO_IMPORT_LOGS,
    nexoImportLogSchema
  ) as NexoImportLogModel;
  nexoImportLogModel.schema = nexoImportLogSchema;

  nexoImportLogModel.lookups = () => {
    return;
  };
  return nexoImportLogModel;
};
