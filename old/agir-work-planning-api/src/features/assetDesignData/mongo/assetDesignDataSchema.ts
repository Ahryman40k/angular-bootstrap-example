import { Schema } from 'mongoose';
import { auditSchema, IAuditAttributes } from '../../audit/mongo/auditSchema';

export interface IAssetDesignDataAttributes {
  upstreamAssetType: string;
  upstreamAssetId: string;
  upstreamDepth: string;
  downstreamAssetType: string;
  downstreamAssetId: string;
  downstreamDepth: string;
  numberOfConnections: number;
  deformation: number;
  hasInfiltration: boolean;
  infiltrationChaining: string;
  infiltrationAssetId: string;
  hasObstruction: boolean;
  obstructionChaining: string;
  obstructionAssetId: string;
  comment: string;
  audit: IAuditAttributes;
}

export const assetDesignDataSchema = new Schema(
  {
    upstreamAssetType: {
      type: String,
      required: false
    },
    upstreamAssetId: {
      type: String,
      required: false
    },
    upstreamDepth: {
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
    downstreamDepth: {
      type: String,
      required: false
    },
    numberOfConnections: {
      type: Number,
      required: false
    },
    deformation: {
      type: Number,
      required: false
    },
    hasInfiltration: {
      type: Boolean,
      required: false
    },
    infiltrationChaining: {
      type: String,
      required: false
    },
    infiltrationAssetId: {
      type: String,
      required: false
    },
    hasObstruction: {
      type: Boolean,
      required: false
    },
    obstructionChaining: {
      type: String,
      required: false
    },
    obstructionAssetId: {
      type: String,
      required: false
    },
    comment: {
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
