import { InterventionStatus } from '@villemontreal/agir-work-planning-lib';
import { IEnrichedIntervention, Permission } from '@villemontreal/agir-work-planning-lib/dist/src';

import { RestrictionsValidator } from '../shared/restrictions/restrictionsValidator';
import { RestrictionType } from '../shared/restrictions/userRestriction';
import { BaseSanitizer } from './baseSanitizer';

class InterventionSanitizer extends BaseSanitizer<IEnrichedIntervention> {
  private readonly readPermissionList = [
    { permission: Permission.INTERVENTION_BUDGET_READ, property: 'estimate' },
    { permission: Permission.INTERVENTION_COMMENT_READ, property: 'comments' },
    { permission: Permission.INTERVENTION_DECISION_READ, property: 'decisions' },
    { permission: Permission.INTERVENTION_DOCUMENT_READ, property: 'documents' },
    { permission: Permission.INTERVENTION_INITIAL_YEAR_READ, property: 'interventionYear' },
    { permission: Permission.INTERVENTION_REQUESTOR_CONTACT_READ, property: 'contact' },
    { permission: Permission.INTERVENTION_ZONE_READ, property: 'geometry' }
  ];

  protected readonly restrictedProperties: (keyof IEnrichedIntervention)[] = ['estimate'];

  public sanitize(intervention: IEnrichedIntervention): IEnrichedIntervention {
    this.filterPropertiesByPermission(intervention, this.readPermissionList);
    this.filterPrivateComments(intervention);
    this.sanitizeByUserRestrictions(intervention);
    return intervention;
  }

  protected validateRestrictions(intervention: IEnrichedIntervention): boolean {
    return (
      RestrictionsValidator.validate([RestrictionType.REQUESTOR], { REQUESTOR: [intervention.requestorId] })
        .isSuccess || ![InterventionStatus.wished].includes(intervention.status as InterventionStatus)
    );
  }

  private filterPrivateComments(intervention: IEnrichedIntervention): void {
    if (!intervention.comments || this.user.hasPermission(Permission.INTERVENTION_COMMENT_READ_PRIVATE)) {
      return;
    }
    intervention.comments = intervention.comments.filter(comment => !!comment.isPublic);
  }
}
export const interventionSanitizer = new InterventionSanitizer();
