import { IAssetLastIntervention, IEnrichedIntervention } from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, remove } from 'lodash';

/**
 * Get intervention for the assetLastIntervention
 * @param assetLastIntervention
 * @param interventions
 * @returns
 */
export function getInterventionForAssetsLastIntervention(
  assetLastIntervention: IAssetLastIntervention,
  interventions: IEnrichedIntervention[]
): IAssetLastIntervention {
  const clonedInterventions = cloneDeep(interventions);
  let clonedAssetLastIntervention = cloneDeep(assetLastIntervention);

  clonedAssetLastIntervention = getInterventionByAssetId(clonedAssetLastIntervention, clonedInterventions);
  clonedAssetLastIntervention = getInterventionByExternalReferenceIds(clonedAssetLastIntervention, clonedInterventions);

  return clonedAssetLastIntervention;
}

/**
 * Looking for the intervention having the corresponding asset id
 * @param assetLastIntervention
 * @param interventions
 * @returns
 */
export function getInterventionByAssetId(
  assetLastIntervention: IAssetLastIntervention,
  interventions: IEnrichedIntervention[]
): IAssetLastIntervention {
  if (assetLastIntervention.intervention || !assetLastIntervention.assetId) {
    return assetLastIntervention;
  }
  interventions.forEach(i => {
    if (i.assets.some(a => a.id === assetLastIntervention.assetId)) {
      assetLastIntervention.intervention = {
        id: i.id,
        planificationYear: i.planificationYear
      };
      remove(
        interventions,
        intervention => assetLastIntervention.intervention && assetLastIntervention.intervention.id === intervention.id
      );
    }
  });
  return assetLastIntervention;
}

/**
 * Looking for the intervention having the corresponding asset external reference id
 * @param assetLastIntervention
 * @param interventions
 * @returns
 */
export function getInterventionByExternalReferenceIds(
  assetLastIntervention: IAssetLastIntervention,
  interventions: IEnrichedIntervention[]
): IAssetLastIntervention {
  if (assetLastIntervention.intervention || !assetLastIntervention.assetExternalReferenceId) {
    return assetLastIntervention;
  }
  interventions.forEach(i => {
    if (
      i.assets.some(a =>
        a.externalReferenceIds.some(
          eri =>
            eri.type === assetLastIntervention.assetExternalReferenceId.type &&
            eri.value === assetLastIntervention.assetExternalReferenceId.value
        )
      )
    ) {
      assetLastIntervention.intervention = {
        id: i.id,
        planificationYear: i.planificationYear
      };
      remove(
        interventions,
        intervention => assetLastIntervention.intervention && assetLastIntervention.intervention.id === intervention.id
      );
    }
  });

  return assetLastIntervention;
}
