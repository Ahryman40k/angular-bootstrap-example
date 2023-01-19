import { IFeature, IFeatureCollection, IGeometry } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Schema } from 'mongoose';
import {
  externalReferenceSchema,
  IExternalReferenceIdAttributes
} from '../../../shared/domain/externalReferenceId/externalReferenceIdSchema';
import { assetDesignDataSchema, IAssetDesignDataAttributes } from '../../assetDesignData/mongo/assetDesignDataSchema';
import { ILengthAttributes } from '../../length/mongo/lengthSchemas';

export interface IAssetAttributes {
  externalReferenceIds: IExternalReferenceIdAttributes[];
  length: ILengthAttributes;
  id: string;
  typeId: string;
  ownerId: string;
  geometry: IGeometry;
  diameter: string;
  material: string;
  suggestedStreetName: string;
  roadSections: IFeatureCollection;
  workArea: IFeature;
  assetDesignData: IAssetDesignDataAttributes;
}

export const assetSchema = new Schema(
  {
    id: {
      type: String
    },
    typeId: {
      type: String,
      required: true
    },
    ownerId: {
      type: String,
      required: true
    },
    length: {
      value: Number,
      unit: String
    },
    geometry: {
      type: Schema.Types.Mixed,
      required: true
    },
    diameter: {
      type: String,
      required: false
    },
    material: {
      type: String,
      required: false
    },
    externalReferenceIds: {
      type: [externalReferenceSchema],
      required: false
    },
    assetDesignData: {
      type: assetDesignDataSchema,
      required: false
    }
  },
  { _id: false }
);
