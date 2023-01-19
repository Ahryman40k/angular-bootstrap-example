import {
  DocumentStatus,
  DocumentType,
  IEnrichedProject,
  IEnrichedProjectAnnualDistribution,
  IPoint,
  IProjectDecision,
  ProjectCategory,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib';
import { isEmpty, range } from 'lodash';

import { ExternalReferenceId } from '../../../shared/domain/externalReferenceId/externalReferenceId';
import { IExternalReferenceIdAttributes } from '../../../shared/domain/externalReferenceId/externalReferenceIdSchema';
import { Guard, GuardType, IGuardArgument } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { commentableAuditable } from '../../../shared/mixins/mixins';
import { Audit } from '../../audit/audit';
import { IAuditableProps } from '../../audit/auditable';
import { IAuditAttributes } from '../../audit/mongo/auditSchema';
import { Comment, ICommentProps, isComment } from '../../comments/models/comment';
import { ICommentableProps } from '../../comments/models/commentable';
import { ICommentAttributes } from '../../comments/mongo/commentSchema';
import { Document } from '../../documents/models/document';
import { IDocumentMongoAttributes } from '../../documents/mongo/documentSchema';
import { IInterventionProps, Intervention } from '../../interventions/models/intervention';
import { Length } from '../../length/models/length';
import { ILengthAttributes } from '../../length/mongo/lengthSchemas';
import { ServicePriority } from '../../servicePriority/models/servicePriority';
import { IServicePriorityAttributes } from '../../servicePriority/mongo/servicePrioritySchema';
import { IProjectAttributes, IRtuExportMongoAttributes } from '../mongo/projectModel';
import { IPlainProjectProps, PlainProject } from './plainProject';
import { RtuExport } from './rtuExport';

export interface IProjectProps extends IPlainProjectProps, IAuditableProps, ICommentableProps {
  moreInformationAudit: Audit;
  contact?: string;
  decisions?: IProjectDecision[];
  documents?: Document[];
  geometryPin?: IPoint;
  interventions: Intervention<IInterventionProps>[];
  length: Length;
  medalId?: string;
  roadNetworkTypeId?: string;
  streetFrom?: string;
  streetTo?: string;
  isOpportunityAnalysis?: boolean;
  annualDistribution?: IEnrichedProjectAnnualDistribution;
  drmNumber?: string;
  submissionNumber?: string;
  rtuExport?: RtuExport;
}

export class Project<P extends IProjectProps> extends commentableAuditable(PlainProject)<P> {
  public static create(props: IProjectProps, id?: string): Result<Project<IProjectProps>> {
    const guardPlain = PlainProject.guard(props);
    const guardAudit = Audit.guard(props.audit);

    const guardBulk: IGuardArgument[] = [
      {
        argument: props.isOpportunityAnalysis,
        argumentName: 'isOpportunityAnalysis',
        guardType: [GuardType.IS_BOOLEAN]
      }
    ];
    const guardResult = Guard.combine([guardPlain, guardAudit, ...Guard.guardBulk(guardBulk)]);
    if (!guardResult.succeeded) {
      return Result.fail<Project<IProjectProps>>(guardResult);
    }
    const project = new Project(props, id);
    return Result.ok<Project<IProjectProps>>(project);
  }

  public static getCategoryId(requestedYear: number, startYear: number, endYear: number, status: string) {
    if (status === ProjectStatus.postponed && requestedYear === startYear) {
      return ProjectCategory.postponed;
    }

    if (startYear < requestedYear && endYear >= requestedYear) {
      return ProjectCategory.completing;
    }

    return ProjectCategory.new;
  }

  public static getYearRange(project: IEnrichedProject): number[] {
    return range(project.startYear, project.endYear + 1);
  }

  public static toPersistance(project: Project<IProjectProps>): IProjectAttributes {
    let externalReferenceIds: IExternalReferenceIdAttributes[];
    if (!isEmpty(project.externalReferenceIds)) {
      externalReferenceIds = project.externalReferenceIds.map(extId => ExternalReferenceId.toPersistance(extId));
    }
    let comments: ICommentAttributes[] = [];
    if (!isEmpty(project.comments)) {
      comments = project.comments.map(comment => Comment.toPersistance(comment));
    }
    let documents: IDocumentMongoAttributes[] = [];
    if (!isEmpty(project.documents)) {
      documents = project.documents.map(document => Document.toPersistance(document));
    }
    let servicePriorities: IServicePriorityAttributes[] = [];
    if (!isEmpty(project.servicePriorities)) {
      servicePriorities = project.servicePriorities.map(sp => ServicePriority.toPersistance(sp));
    }
    let moreInformationAudit: IAuditAttributes;
    if (!isEmpty(project.moreInformationAudit)) {
      moreInformationAudit = Audit.toPersistance(project.moreInformationAudit);
    }
    let rtuExport: IRtuExportMongoAttributes;
    if (!isEmpty(project.rtuExport)) {
      rtuExport = RtuExport.toPersistance(project.rtuExport);
    }
    let length: ILengthAttributes;
    if (!isEmpty(project.length)) {
      length = Length.toPersistance(project.length);
    }
    return {
      _id: project.id,
      boroughId: project.boroughId,
      comments,
      endYear: project.endYear,
      executorId: project.executorId,
      externalReferenceIds,
      geometry: project.geometry,
      globalBudget: project.globalBudget,
      importFlag: project.importFlag,
      inChargeId: project.inChargeId,
      interventionIds: project.interventionIds,
      servicePriorities,
      projectName: project.projectName,
      projectTypeId: project.projectTypeId,
      riskId: project.riskId,
      startYear: project.startYear,
      status: project.status,
      streetName: project.streetName,
      subCategoryIds: project.subCategoryIds,
      audit: Audit.toPersistance(project.audit),
      moreInformationAudit,
      annualDistribution: project.annualDistribution,
      contact: project.contact,
      decisions: project.decisions,
      documents,
      geometryPin: project.geometryPin,
      length,
      medalId: project.medalId,
      roadNetworkTypeId: project.roadNetworkTypeId,
      streetFrom: project.streetFrom,
      streetTo: project.streetTo,
      isOpportunityAnalysis: project.isOpportunityAnalysis,
      drmNumber: project.drmNumber,
      submissionNumber: project.submissionNumber,
      rtuExport
    };
  }

  // TODO DELETE AFTER PROJECT REFACTO
  // USED TO CHECK DATA BEFORE PRESISTAMCE
  // tslint:disable-next-line:cyclomatic-complexity
  // tslint:disable-next-line:max-func-body-length
  public static fromEnrichedToInstance(enriched: IEnrichedProject): Project<IProjectProps> {
    let audit: Audit = Audit.fromCreateContext();
    if (enriched?.audit) {
      audit = Audit.generateAuditFromIAudit(enriched.audit);
    }
    let moreInformationAudit: Audit;
    if (enriched?.moreInformationAudit) {
      moreInformationAudit = Audit.generateAuditFromIAudit(enriched.moreInformationAudit);
    }

    let length: Length;
    if (enriched?.length) {
      length = Length.create({
        value: enriched.length.value,
        unit: enriched.length.unit
      }).getValue();
    }

    let rtuExport: RtuExport;
    if (enriched?.rtuExport) {
      rtuExport = RtuExport.create({
        status: enriched.rtuExport.status,
        exportAt: enriched.rtuExport.exportAt
      }).getValue();
    }

    let externalReferenceIds: ExternalReferenceId[] = [];
    if (enriched?.externalReferenceIds && !isEmpty(enriched?.externalReferenceIds)) {
      externalReferenceIds = enriched.externalReferenceIds.map(c => {
        return ExternalReferenceId.create({
          type: c.type,
          value: c.value
        }).getValue();
      });
    }

    let servicePriorities: ServicePriority[] = [];
    if (enriched?.servicePriorities && !isEmpty(enriched?.servicePriorities)) {
      servicePriorities = enriched.servicePriorities.map(c => {
        return ServicePriority.create({
          service: c.service,
          priorityId: c.priorityId
        }).getValue();
      });
    }

    let comments: Comment[] = [];
    if (enriched?.comments && !isEmpty(enriched?.comments)) {
      comments = enriched.comments.map(c => {
        let commentAudit = Audit.fromCreateContext();
        if (c.audit) {
          commentAudit = Audit.generateAuditFromIAudit(c.audit);
        }
        return Comment.create(
          {
            categoryId: c.categoryId,
            text: c.text,
            isPublic: c.isPublic,
            isProjectVisible: c.isProjectVisible,
            audit: commentAudit
          },
          c.id
        ).getValue();
      });
    }

    let documents: Document[] = [];
    if (enriched?.documents && !isEmpty(enriched?.documents)) {
      documents = enriched.documents.map(d => {
        let documentAudit = Audit.fromCreateContext();
        if (d.audit) {
          documentAudit = Audit.generateAuditFromIAudit(d.audit);
        }
        return Document.create(
          {
            fileName: d.fileName,
            documentName: d.documentName,
            notes: d.notes,
            objectId: (d as any).objectId,
            type: d.type as DocumentType,
            validationStatus: (d.validationStatus as DocumentStatus) || DocumentStatus.validated,
            audit: documentAudit
          },
          d.id
        ).getValue();
      });
    }

    const projectProps: IProjectProps = {
      audit,
      moreInformationAudit,
      contact: enriched.contact,
      decisions: enriched.decisions,
      documents,
      geometryPin: enriched.geometryPin,
      length,
      medalId: enriched.medalId,
      roadNetworkTypeId: enriched.roadNetworkTypeId,
      streetFrom: enriched.streetFrom,
      streetTo: enriched.streetTo,
      isOpportunityAnalysis: enriched.isOpportunityAnalysis,
      annualDistribution: enriched.annualDistribution,
      drmNumber: enriched.drmNumber,
      submissionNumber: enriched.submissionNumber,
      rtuExport,
      externalReferenceIds,
      servicePriorities,
      boroughId: enriched.boroughId,
      comments,
      endYear: enriched.endYear,
      executorId: enriched.executorId,
      geometry: enriched.geometry,
      globalBudget: enriched.globalBudget,
      importFlag: enriched.importFlag,
      inChargeId: enriched.inChargeId,
      interventionIds: enriched.interventionIds,
      interventions: [], // INTERVENTIONS ALWAYS EMTPY AS IT USED BEFORE PERSIST
      projectName: enriched.projectName,
      projectTypeId: enriched.projectTypeId,
      riskId: enriched.riskId,
      startYear: enriched.startYear,
      status: enriched.status,
      streetName: enriched.streetName,
      subCategoryIds: enriched.subCategoryIds
    };
    return Project.create(projectProps, enriched.id).getValue();
  }

  private readonly _comments: Comment[] = [];
  constructor(props: P, id: string = null) {
    super(props, id);

    if (isEmpty(props.decisions)) {
      this.props.decisions = [];
    }
    if (isEmpty(props.documents)) {
      this.props.documents = [];
    }
    if (isEmpty(props.interventions)) {
      this.props.interventions = [];
    }
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

  public get contact(): string {
    return this.props.contact;
  }

  public get decisions(): IProjectDecision[] {
    return this.props.decisions;
  }

  public get documents(): Document[] {
    return this.props.documents;
  }

  public get geometryPin(): IPoint {
    return this.props.geometryPin;
  }

  public get interventions(): Intervention<IInterventionProps>[] {
    return this.props.interventions;
  }

  public get length(): Length {
    return this.props.length;
  }

  public get medalId(): string {
    return this.props.medalId;
  }

  public get roadNetworkTypeId(): string {
    return this.props.roadNetworkTypeId;
  }

  public get streetFrom(): string {
    return this.props.streetFrom;
  }

  public get streetTo(): string {
    return this.props.streetTo;
  }

  public get isOpportunityAnalysis(): boolean {
    return this.props.isOpportunityAnalysis;
  }

  public get moreInformationAudit(): Audit {
    return this.props.moreInformationAudit;
  }

  public get rtuExport(): RtuExport {
    return this.props.rtuExport;
  }

  public get annualDistribution(): IEnrichedProjectAnnualDistribution {
    return this.props.annualDistribution;
  }

  public get drmNumber(): string {
    return this.props.drmNumber;
  }

  public get submissionNumber(): string {
    return this.props.submissionNumber;
  }

  public get comments(): Comment[] {
    return this._comments;
  }
}

// should be a class method
export function getProgramBookIds(project: IEnrichedProject): string[] {
  const pbIds = project.annualDistribution?.annualPeriods?.map(ap => ap.programBookId);
  if (isEmpty(pbIds)) {
    return [];
  }
  return pbIds;
}

export const isProject = (v: any): v is Project<IProjectProps> => {
  return v instanceof Project;
};
