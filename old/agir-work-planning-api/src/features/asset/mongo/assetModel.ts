import { IFeature, IFeatureCollection, IGeometry, ILength } from '@villemontreal/agir-work-planning-lib';
import { IExternalReferenceIdAttributes } from '../../../shared/domain/externalReferenceId/externalReferenceIdSchema';

export interface IAssetMongoAttributes {
  id?: string;
  typeId: string;
  ownerId: string;
  length?: ILength;
  geometry: IGeometry;
  suggestedStreetName?: string;
  roadSections?: IFeatureCollection;
  workArea?: IFeature;
  externalReferenceIds?: IExternalReferenceIdAttributes[];
}
