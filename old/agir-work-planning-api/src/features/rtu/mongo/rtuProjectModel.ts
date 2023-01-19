import { IPoint } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Connection, Document } from 'mongoose';
import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { IAuditAttributes } from '../../audit/mongo/auditSchema';
import { IRtuProjectProps } from '../models/rtuProject';
import { rtuProjectSchema } from './rtuProjectSchema';

export interface IRtuContactProjectMongoAttributes {
  _id: string;
  officeId: string;
  num: string;
  prefix: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  phoneExtensionNumber: string;
  cell: string;
  fax: string;
  typeNotfc: string;
  paget: string;
  profile: string;
  globalRole: string;
  idInterim: string;
  inAutoNotification: string;
  inDiffusion: string;
  areaName: string;
  role: string;
  partnerType: string;
  partnerId: string;
}
export interface IRtuProjectMongoAttributes {
  _id: string;
  name: string;
  description: string;
  areaId: string;
  partnerId: string;
  noReference: string;
  geometryPin: IPoint;
  geometry: any;
  status: string;
  type: string;
  phase: string;
  dateStart: string;
  dateEnd: string;
  dateEntry: string;
  dateModification: string;
  cancellationReason: string;
  productionPb: string;
  conflict: string;
  duration: string;
  localization: string;
  streetName: string;
  streetFrom: string;
  streetTo: string;
  contact: IRtuContactProjectMongoAttributes;
  audit: IAuditAttributes;
}

export type IRtuProjectMongoDocument = IRtuProjectProps & Document;
export type RtuProjectModel = CustomModel<IRtuProjectProps>;

export const rtuProjectModelFactory = (mongoose: Connection) => {
  const rtuProjectModel = mongoose.model<IRtuProjectMongoDocument>(
    constants.mongo.collectionNames.RTU_PROJECTS,
    rtuProjectSchema
  ) as RtuProjectModel;
  rtuProjectModel.schema = rtuProjectSchema;
  rtuProjectModel.hasObjectId = false;

  rtuProjectModel.lookups = (aggregate, expand: string[] = []) => {
    return;
  };
  return rtuProjectModel;
};
