import { IAudit, IEnrichedDocument } from '@villemontreal/agir-work-planning-lib';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { Document } from '../models/document';
import { isDocumentIntervention } from '../models/documentIntervention';
export interface IDocumentMapperOptions {
  hasObjectId: boolean;
}

export class DocumentMapperDTO extends FromModelToDtoMappings<Document, IEnrichedDocument, IDocumentMapperOptions> {
  protected async getFromNotNullModel(
    document: Document,
    options?: IDocumentMapperOptions
  ): Promise<IEnrichedDocument> {
    const auditDTO = await auditMapperDTO.getFromModel(document.audit);
    return this.map(document, auditDTO, options);
  }

  private map(document: Document, auditDTO: IAudit, options: IDocumentMapperOptions): IEnrichedDocument {
    let mappedDTO: IEnrichedDocument = {
      id: document.id,
      type: document.type,
      fileName: document.fileName,
      documentName: document.documentName,
      notes: document.notes,
      validationStatus: document.validationStatus,
      audit: auditDTO
    };

    if (isDocumentIntervention(document)) {
      mappedDTO = {
        ...mappedDTO,
        isProjectVisible: document.isProjectVisible
      };
    }

    // this is a hack to not remap Document object in intervention et project usecase to be able to store objectId
    if (options?.hasObjectId) {
      return {
        ...mappedDTO,
        objectId: document.objectId
      } as IEnrichedDocument;
    }
    return mappedDTO;
  }
}

export const documentMapperDTO = new DocumentMapperDTO();
