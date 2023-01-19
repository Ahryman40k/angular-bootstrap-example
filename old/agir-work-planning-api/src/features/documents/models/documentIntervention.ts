import { DocumentStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isNil } from 'lodash';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { auditable } from '../../../shared/mixins/mixins';
import { Audit } from '../../audit/audit';
import { IInterventionDocumentMongoAttributes } from '../mongo/documentSchema';
import { Document, IDocumentProps } from './document';
import { PlainDocument } from './plainDocument';
import { IPlainDocumentInterventionProps, PlainDocumentIntervention } from './plainDocumentIntervention';

// tslint:disable:no-empty-interface
export interface IDocumentInterventionProps extends IPlainDocumentInterventionProps, IDocumentProps {}

export class DocumentIntervention extends auditable(PlainDocumentIntervention)<IDocumentInterventionProps> {
  public static create(props: IDocumentInterventionProps, id?: string): Result<DocumentIntervention> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<DocumentIntervention>(guard);
    }
    const document = new DocumentIntervention(props, id);
    return Result.ok<DocumentIntervention>(document);
  }

  public static async toDomainModel(raw: IInterventionDocumentMongoAttributes): Promise<DocumentIntervention> {
    return DocumentIntervention.create(await this.mapToDomainModel(raw), raw._id?.toString()).getValue();
  }

  protected static async mapToDomainModel(
    raw: IInterventionDocumentMongoAttributes
  ): Promise<IDocumentInterventionProps> {
    return {
      ...(await Document.mapToDomainModel(raw)),
      isProjectVisible: raw.isProjectVisible
    };
  }

  public static toPersistance(document: DocumentIntervention): IInterventionDocumentMongoAttributes {
    return {
      ...Document.toPersistance(document),
      isProjectVisible: document.isProjectVisible
    };
  }

  public get objectId(): string {
    return this.props.objectId;
  }

  public get isProjectVisible(): boolean {
    return this.props.isProjectVisible;
  }

  protected static guard(props: IDocumentInterventionProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.objectId,
        argumentName: 'objectId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      }
    ];
    return Guard.combine([PlainDocument.guard(props), Audit.guard(props.audit), ...Guard.guardBulk(guardBulk)]);
  }

  constructor(props: IDocumentInterventionProps, id: string) {
    if (!props.validationStatus) {
      props.validationStatus = DocumentStatus.pending;
    }
    if (isNil(props.isProjectVisible)) {
      props.isProjectVisible = false;
    }
    super(props, id);
  }
}

export const isDocumentIntervention = (v: any): v is DocumentIntervention => {
  return v instanceof DocumentIntervention;
};
