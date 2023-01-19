import { IExternalReferenceId, IInterventionArea } from '@villemontreal/agir-work-planning-lib';

import { InterventionType } from './intervention-type';

export interface IInterventionPatch {
  interventionTypeId?: InterventionType;
  interventionArea?: IInterventionArea;
  externalReferenceIds?: IExternalReferenceId[];
}
