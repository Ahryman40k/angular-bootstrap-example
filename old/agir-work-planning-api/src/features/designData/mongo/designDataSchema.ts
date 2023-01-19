import { Schema } from 'mongoose';
import { auditSchema, IAuditAttributes } from '../../audit/mongo/auditSchema';

export interface IDesignDataAttributes {
  upstreamAssetType: string;
  upstreamAssetId: string;
  downstreamAssetType: string;
  downstreamAssetId: string;
  comment: string;
  contractRange: string;
  audit: IAuditAttributes;
}

export const designDataSchema = new Schema(
  {
    upstreamAssetType: {
      type: String,
      required: false
    },
    upstreamAssetId: {
      type: String,
      required: false
    },
    downstreamAssetType: {
      type: String,
      required: false
    },
    downstreamAssetId: {
      type: String,
      required: false
    },
    comment: {
      type: String,
      required: false
    },
    contractRange: {
      type: String,
      required: false
    },
    audit: {
      type: auditSchema,
      required: true
    }
  },
  { _id: false }
);
