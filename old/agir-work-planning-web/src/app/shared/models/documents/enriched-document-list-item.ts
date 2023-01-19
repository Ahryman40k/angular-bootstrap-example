import { IEnrichedDocument } from '@villemontreal/agir-work-planning-lib/dist/src';

/**
 * Represents a document as a list item.
 */
export interface IEnrichedDocumentListItem extends IEnrichedDocument {
  /**
   * The document list item has an optional intervention ID because the document can be owned by the project's intervention.
   */
  interventionId?: string;
}
