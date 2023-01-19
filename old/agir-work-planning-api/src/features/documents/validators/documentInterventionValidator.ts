import { IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { IPlainDocumentInterventionProps } from '../models/plainDocumentIntervention';
import { DocumentValidator } from './documentValidator';

export class DocumentInterventionValidator {
  public static async validateTaxonomies(
    plainDocument: IPlainDocumentInterventionProps
  ): Promise<Result<IGuardResult>> {
    return DocumentValidator.validateTaxonomies(plainDocument);
  }
}
export const documentValidator = new DocumentInterventionValidator();
