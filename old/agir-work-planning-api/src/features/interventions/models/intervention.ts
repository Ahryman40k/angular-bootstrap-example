import {
  IBudget,
  IEnrichedIntervention,
  IInterventionAnnualDistribution,
  IInterventionDecision,
  IProject
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { ExternalReferenceId } from '../../../shared/domain/externalReferenceId/externalReferenceId';
import { IExternalReferenceIdAttributes } from '../../../shared/domain/externalReferenceId/externalReferenceIdSchema';
import { Guard, IGuardArgument } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { commentableAuditable } from '../../../shared/mixins/mixins';
import { isEmpty } from '../../../utils/utils';
import { Asset } from '../../asset/models/asset';
import { IAssetAttributes } from '../../asset/mongo/assetSchemas';
import { Audit } from '../../audit/audit';
import { IAuditableProps } from '../../audit/auditable';
import { IAuditAttributes } from '../../audit/mongo/auditSchema';
import { Comment, ICommentProps, isComment } from '../../comments/models/comment';
import { ICommentableProps } from '../../comments/models/commentable';
import { ICommentAttributes } from '../../comments/mongo/commentSchema';
import { DesignData } from '../../designData/models/designData';
import { IDesignDataAttributes } from '../../designData/mongo/designDataSchema';
import { DocumentIntervention } from '../../documents/models/documentIntervention';
import { IInterventionDocumentMongoAttributes } from '../../documents/mongo/documentSchema';
import { IInterventionAttributes } from '../mongo/interventionAttributes';
import { IPlainInterventionProps, PlainIntervention } from './plainIntervention';

export interface IInterventionProps extends IPlainInterventionProps, IAuditableProps, ICommentableProps {
  audit: Audit;
  estimate: IBudget; // TODO estimate should be a class
  executorId: string;
  project?: IProject;
  documents?: DocumentIntervention[];
  roadNetworkTypeId: string;
  decisions?: IInterventionDecision[];
  streetName?: string;
  streetFrom?: string;
  streetTo?: string;
  annualDistribution?: IInterventionAnnualDistribution;
  designData?: DesignData;
  version?: number;
  moreInformationAudit?: Audit;
}

// TODO MUST BE COMPLETED WITH ALL PROPS AND GUARD
// Must use generic as intervention is parent of other classes (NexoIntervention for import)
export class Intervention<P extends IInterventionProps> extends commentableAuditable(PlainIntervention)<P> {
  public static create(props: IInterventionProps, id?: string): Result<Intervention<IInterventionProps>> {
    const guardPlain = PlainIntervention.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guardBulk: IGuardArgument[] = [];
    const guardResult = Guard.combine([guardPlain, guardAudit, ...Guard.guardBulk(guardBulk)]);
    if (!guardResult.succeeded) {
      return Result.fail<Intervention<IInterventionProps>>(guardResult);
    }
    const intervention = new Intervention(props, id);
    return Result.ok<Intervention<IInterventionProps>>(intervention);
  }

  public static async toDomainModel(raw: IInterventionAttributes): Promise<Intervention<IInterventionProps>> {
    let externalReferenceIds: ExternalReferenceId[];
    if (!isEmpty(raw.externalReferenceIds)) {
      externalReferenceIds = await Promise.all(
        raw.externalReferenceIds.map(extId => {
          return ExternalReferenceId.toDomainModel(extId);
        })
      );
    }
    let comments: Comment[];
    if (!isEmpty(raw.comments)) {
      comments = await Promise.all(
        raw.comments.map(comment => {
          return Comment.toDomainModel(comment);
        })
      );
    }
    let documents: DocumentIntervention[];
    if (!isEmpty(raw.documents)) {
      documents = await Promise.all(
        raw.documents.map(document => {
          return DocumentIntervention.toDomainModel(document);
        })
      );
    }
    let assets: Asset[];
    if (!isEmpty(raw.assets)) {
      assets = await Promise.all(
        raw.assets.map(asset => {
          return Asset.toDomainModel(asset);
        })
      );
    }

    return Intervention.create(
      {
        externalReferenceIds,
        comments,
        medalId: raw.medalId,
        importRevisionDate: raw.importRevisionDate,
        interventionName: raw.interventionName,
        interventionTypeId: raw.interventionTypeId,
        workTypeId: raw.workTypeId,
        requestorId: raw.requestorId,
        executorId: raw.executorId,
        boroughId: raw.boroughId,
        status: raw.status,
        interventionYear: raw.interventionYear,
        planificationYear: raw.planificationYear,
        endYear: raw.endYear,
        programId: raw.programId,
        contact: raw.contact,
        assets,
        interventionArea: raw.interventionArea,
        roadSections: raw.roadSections,
        importFlag: raw.importFlag,
        version: raw.version,
        estimate: raw.estimate,
        annualDistribution: raw.annualDistribution,
        project: raw.project,
        documents,
        decisions: raw.decisions,
        decisionRequired: raw.decisionRequired,
        audit: await Audit.toDomainModel(raw.audit),
        streetName: raw.streetName,
        streetFrom: raw.streetFrom,
        streetTo: raw.streetTo,
        roadNetworkTypeId: raw.roadNetworkTypeId,
        designData: raw.designData ? await DesignData.toDomainModel(raw.designData) : undefined,
        moreInformationAudit: await Audit.toDomainModel(raw.moreInformationAudit)
      },
      raw._id
    ).getValue();
  }

  public static toPersistance(intervention: Intervention<IInterventionProps>): IInterventionAttributes {
    let externalReferenceIds: IExternalReferenceIdAttributes[];
    if (!isEmpty(intervention.externalReferenceIds)) {
      externalReferenceIds = intervention.externalReferenceIds.map(extId => ExternalReferenceId.toPersistance(extId));
    }
    let comments: ICommentAttributes[] = [];
    if (!isEmpty(intervention.comments)) {
      comments = intervention.comments.map(comment => Comment.toPersistance(comment));
    }
    let assets: IAssetAttributes[];
    if (!isEmpty(intervention.assets)) {
      assets = intervention.assets.map(asset => Asset.toPersistance(asset));
    }
    let moreInformationAudit: IAuditAttributes;
    if (!isEmpty(intervention.moreInformationAudit)) {
      moreInformationAudit = Audit.toPersistance(intervention.moreInformationAudit);
    }
    let documents: IInterventionDocumentMongoAttributes[] = [];
    if (!isEmpty(intervention.documents)) {
      documents = intervention.documents.map(document => DocumentIntervention.toPersistance(document));
    }
    let designData: IDesignDataAttributes;
    if (!isEmpty(intervention.designData)) {
      designData = DesignData.toPersistance(intervention.designData);
    }
    return {
      _id: intervention.id,
      externalReferenceIds,
      comments,
      medalId: intervention.medalId,
      importRevisionDate: intervention.importRevisionDate,
      interventionName: intervention.interventionName,
      interventionTypeId: intervention.interventionTypeId,
      workTypeId: intervention.workTypeId,
      requestorId: intervention.requestorId,
      executorId: intervention.executorId,
      boroughId: intervention.boroughId,
      status: intervention.status,
      interventionYear: intervention.interventionYear,
      planificationYear: intervention.planificationYear,
      endYear: intervention.endYear,
      programId: intervention.programId,
      contact: intervention.contact,
      assets,
      interventionArea: intervention.interventionArea,
      roadSections: intervention.roadSections,
      importFlag: intervention.importFlag,
      version: intervention.version,
      estimate: intervention.estimate,
      annualDistribution: intervention.annualDistribution,
      project: intervention.project,
      documents,
      decisions: intervention.decisions,
      decisionRequired: intervention.decisionRequired,
      audit: Audit.toPersistance(intervention.audit),
      streetName: intervention.streetName,
      streetFrom: intervention.streetFrom,
      streetTo: intervention.streetTo,
      roadNetworkTypeId: intervention.roadNetworkTypeId,
      designData,
      moreInformationAudit
    };
  }

  private readonly _comments: Comment[] = [];
  constructor(props: P, id: string = null) {
    super(props, id);
    if (!isEmpty(props.comments)) {
      this._comments = props.comments.map(comment => {
        if (isComment(comment)) {
          return comment;
        }
        return Comment.create(
          {
            ...(comment as ICommentProps)
          },
          (comment as any).id
        ).getValue();
      });
    }
  }

  public get estimate(): IBudget {
    return this.props.estimate;
  }

  public get executorId(): string {
    return this.props.executorId;
  }

  public get project(): IProject {
    return this.props.project;
  }

  public get documents(): DocumentIntervention[] {
    return this.props.documents;
  }

  public get roadNetworkTypeId(): string {
    return this.props.roadNetworkTypeId;
  }

  public get decisions(): IInterventionDecision[] {
    return this.props.decisions;
  }

  public get streetName(): string {
    return this.props.streetName;
  }

  public get streetFrom(): string {
    return this.props.streetFrom;
  }

  public get streetTo(): string {
    return this.props.streetTo;
  }

  public get annualDistribution(): IInterventionAnnualDistribution {
    return this.props.annualDistribution;
  }

  public get version(): number {
    return this.props.version;
  }

  public get moreInformationAudit(): Audit {
    return this.props.moreInformationAudit;
  }

  public get comments(): Comment[] {
    return this._comments;
  }

  public get designData(): DesignData {
    return this.props.designData;
  }

  public setAnnualDistribution(annualDistribution: IInterventionAnnualDistribution): void {
    this.props.annualDistribution = annualDistribution;
  }
}

export const isIntervention = (v: any): v is Intervention<IInterventionProps> => {
  return v instanceof Intervention;
};

export function resetInterventionAttributes(
  intervention: IEnrichedIntervention | Intervention<any>
): IEnrichedIntervention | Intervention<any> {
  if (isIntervention(intervention)) {
    intervention.props.project = null;
    intervention.props.annualDistribution = null;
    return intervention;
  }
  return {
    ...intervention,
    project: null,
    annualDistribution: null
  } as IEnrichedIntervention;
}
