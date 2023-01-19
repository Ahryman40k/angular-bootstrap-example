import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';
import { auditSchema } from '../../audit/mongo/auditSchema';
import { IRtuContactProjectProps } from '../models/rtuContactProject';
import { IRtuProjectProps } from '../models/rtuProject';

export const rtuContactProjectSchema = new Schema<IRtuContactProjectProps>(
  {
    _id: String,
    officeId: String,
    num: String,
    prefix: String,
    name: String,
    title: String,
    email: String,
    phone: String,
    phoneExtensionNumber: String,
    cell: String,
    fax: String,
    typeNotfc: String,
    paget: String,
    profile: String,
    globalRole: String,
    idInterim: String,
    inAutoNotification: String,
    inDiffusion: String,
    areaName: String,
    role: String,
    partnerType: String,
    partnerId: String
  },
  {
    _id: false
  }
);

export const rtuProjectSchema = new Schema<IRtuProjectProps>(
  {
    _id: String,
    name: String,
    description: String,
    areaId: String,
    partnerId: String,
    noReference: String,
    geometryPin: {
      type: Schema.Types.Mixed,
      required: false,
      default: undefined
    },
    geometry: {
      type: Schema.Types.Mixed,
      required: false,
      default: undefined
    },
    status: String,
    type: String,
    phase: String,
    dateStart: Date,
    dateEnd: Date,
    dateEntry: Date,
    dateModification: Date,
    cancellationReason: String,
    productionPb: String,
    conflict: String,
    duration: String,
    localization: String,
    streetName: String,
    streetFrom: String,
    streetTo: String,
    contact: rtuContactProjectSchema,
    audit: auditSchema
  },
  {
    _id: false,
    strict: true,
    collection: constants.mongo.collectionNames.RTU_PROJECTS,
    versionKey: false
  }
);
