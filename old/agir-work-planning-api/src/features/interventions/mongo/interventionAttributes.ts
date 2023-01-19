import {
  IBudget,
  IFeatureCollection,
  IInterventionAnnualDistribution,
  IInterventionArea,
  IInterventionDecision,
  IProject
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { IExternalReferenceIdAttributes } from '../../../shared/domain/externalReferenceId/externalReferenceIdSchema';
import { IAssetAttributes } from '../../asset/mongo/assetSchemas';
import { IAuditAttributes } from '../../audit/mongo/auditSchema';
import { ICommentAttributes } from '../../comments/mongo/commentSchema';
import { IDesignDataAttributes } from '../../designData/mongo/designDataSchema';
import { IInterventionDocumentMongoAttributes } from '../../documents/mongo/documentSchema';

export interface IInterventionAttributes {
  _id: string;
  comments: ICommentAttributes[];
  assets: IAssetAttributes[];
  externalReferenceIds?: IExternalReferenceIdAttributes[];
  executorId: string;
  medalId: string;
  importRevisionDate: string;
  interventionName: string;
  interventionTypeId: string;
  workTypeId: string;
  requestorId: string;
  boroughId: string;
  status: string;
  interventionYear: number;
  planificationYear: number;
  endYear: number;
  programId: string;
  contact: string;
  interventionArea: IInterventionArea;
  roadSections: IFeatureCollection;
  importFlag: string;
  version: number;
  estimate: IBudget;
  annualDistribution: IInterventionAnnualDistribution;
  project: IProject;
  documents: IInterventionDocumentMongoAttributes[];
  decisions: IInterventionDecision[];
  decisionRequired: boolean;
  streetName: string;
  streetFrom: string;
  streetTo: string;
  roadNetworkTypeId: string;
  moreInformationAudit: IAuditAttributes;
  designData: IDesignDataAttributes;
  audit: IAuditAttributes;
}
