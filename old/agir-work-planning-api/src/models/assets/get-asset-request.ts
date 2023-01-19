import { AssetExpand, AssetType } from '@villemontreal/agir-work-planning-lib/dist/src';

export interface IGetAssetRequest {
  id: string;
  type: AssetType;
  expand?: AssetExpand[];
}
