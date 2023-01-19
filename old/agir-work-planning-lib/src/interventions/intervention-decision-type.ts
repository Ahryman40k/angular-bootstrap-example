/**
 * Enum containing the full list of all possible intervention decision types.
 *
 * *Keep it sorted alphabetically. (If using VSCode, use "Sort Lines Ascending" command)*
 */
export enum InterventionDecisionType {
  accepted = 'accepted',
  acceptedRequirement = 'acceptedRequirement',
  canceled = 'canceled',
  planned = 'planned',
  postponed = 'postponed',
  refused = 'refused',
  replanned = 'replanned',
  returned = 'returned',
  revisionRequest = 'revisionRequest'
}
