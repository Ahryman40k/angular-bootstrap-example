import { IPlainIntervention } from '@villemontreal/agir-work-planning-lib';

import { assetMocks } from './asset.mocks';
import { taxonomyMocks } from './taxonomy.mocks';

export const interventionMocks: IPlainIntervention[] = [
  {
    id: null,
    interventionName: 'interventionName',
    assets: [assetMocks[0]],
    boroughId: taxonomyMocks.requestors[0].code,
    contact: 'Jean Girard',
    planificationYear: 2021,
    estimate: 2000,
    interventionArea: {
      geometry: null,
      isEdited: false
    },
    interventionTypeId: taxonomyMocks.requestors[0].code,
    interventionYear: 2021,
    programId: taxonomyMocks.requestors[0].code,
    requestorId: taxonomyMocks.requestors[0].code,
    executorId: taxonomyMocks.executors[0].code,
    roadSections: null,
    status: null,
    workTypeId: null,
    audit: null
  }
];
