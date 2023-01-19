import { IAudit } from '@villemontreal/agir-work-planning-lib';
import { authorSchema } from './authorSchema';

// tslint:disable:no-empty-interface
export interface IAuditAttributes extends IAudit {}

export const auditSchema = {
  createdAt: String,
  createdBy: authorSchema,
  lastModifiedAt: String,
  lastModifiedBy: authorSchema,
  expiredAt: String,
  expiredBy: authorSchema
};
