import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';

const importRelationInterventionSchema = new Schema<IImportRelationIntervention>(
  {
    interventionId: {
      type: String,
      required: true
    },
    MEDAILLE_AMENAGEMENT: {
      type: String,
      required: false
    },
    NO_PROJET: {
      type: String,
      required: false
    },
    LONGUEUR_INTERV_REQUERANT: {
      type: String,
      required: false
    },
    LONGUEUR_GLOBAL: {
      type: String,
      required: false
    },
    TYPE_INTERVENTION: {
      type: String,
      required: false
    },
    NOM_ARRONDISSEMENT: {
      type: String,
      required: false
    }
  },
  {
    _id: false
  }
);

export const importRelationSchema = new Schema<IImportRelation>(
  {
    bicProjectId: {
      type: String,
      required: false
    },
    bicProjectNumber: {
      type: String,
      required: true
    },
    projectId: {
      type: String,
      required: true
    },
    interventions: {
      type: [importRelationInterventionSchema],
      required: true
    },
    __v: Number
  },
  {
    collection: constants.mongo.collectionNames.IMPORT_RELATIONS,
    versionKey: false
  }
);

export interface IImportRelation {
  bicProjectNumber: string;
  bicProjectId: string;
  projectId: string;
  /**
   * DEPRECATED
   * The intervention Ids.
   * Use interventions instead.
   */
  interventionIds?: string[];
  interventions: IImportRelationIntervention[];
}

export interface IImportRelationIntervention {
  interventionId: string;
  ID_AMPLEUR_SARA?: number;
  MEDAILLE_AMENAGEMENT?: string;
  NO_PROJET: string;
  LONGUEUR_INTERV_REQUERANT?: number;
  LONGUEUR_GLOBAL?: number;
  TYPE_INTERVENTION?: string;
  NOM_ARRONDISSEMENT?: string;
}
