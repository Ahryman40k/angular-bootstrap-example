import {
  DocumentStatus,
  DocumentType,
  ExternalReferenceType,
  IBudget,
  IEnrichedIntervention,
  IFeatureCollection,
  IGeometry,
  IInterventionAnnualDistribution,
  IInterventionArea,
  IInterventionDecision,
  InterventionDecisionType,
  InterventionExternalReferenceType,
  InterventionStatus,
  InterventionType,
  ITaxonomy,
  ModificationType,
  NexoImportStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Feature, MultiPolygon, Polygon } from 'geojson';
import { isEmpty, isNil, range } from 'lodash';

import { interventionAnnualDistributionService } from '../../../../services/annualDistribution/interventionAnnualDistributionService';
import { auditService } from '../../../../services/auditService';
import { workAreaService } from '../../../../services/workAreaService';
import { ExternalReferenceId } from '../../../../shared/domain/externalReferenceId/externalReferenceId';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { EXECUTOR_DI } from '../../../../shared/taxonomies/constants';
import { enumValues } from '../../../../utils/enumUtils';
import { AuthorizedDateFormats } from '../../../../utils/moment/moment.enum';
import { ISheet2JSONOpts } from '../../../../utils/spreadsheets/spreadsheetsUtils';
import { appUtils, IKeyAndValue } from '../../../../utils/utils';
import { Asset } from '../../../asset/models/asset';
import { Audit } from '../../../audit/audit';
import { Comment } from '../../../comments/models/comment';
import { DocumentIntervention } from '../../../documents/models/documentIntervention';
import { interventionService } from '../../../interventions/interventionService';
import { taxonomyService } from '../../../taxonomies/taxonomyService';
import {
  NEXO_CODE_PHASE_CANCELED,
  NEXO_CODE_STATUS_CARNET_RECEIVED,
  NexoImportFileValidator
} from '../../validators/nexoImportFileValidator';
import { INexoInterventionProps, NexoIntervention } from '../nexoIntervention';
import { NexoLogIntervention } from '../nexoLogIntervention';
import { INexoHeaders, minimalNexoRow, NexoRow, NO_ID_PROVIDED } from './nexoRow';

export interface IInterventionSEComment {
  text: string;
}

export const NO_DOSSIER_SE = '15-LAC-PTI-003-AQ';
export const NEXO_CARNET = 'C21aq';
export const CANCEL_NEXO_PHASE_CODE = '1';
export const AQUEDUCT_SEGMENT_NEXO_ASSET_CODE = '4';
export const RECONSTRUCTION_NEXO_WORK_TYPE_CODE = '1';
export const DI_NEXO_EXECUTOR_CODE = '1';
export const PUBLISHED_NEXO_BOOK_STATUS_CODE = '3';

// Keys follows column order from interventionSE import file example
export interface IInterventionSEHeaders extends INexoHeaders {
  iDActif: string;
  diametre: string;
  materiau: string;
  dateInstallation: number;
  longueurExistant: number;
  longueurIntervention: number;
  pourcentage: number;
  versionPI: number;
  noDossierSE: string;
  codePhase: string;
  uniteResponsable: string;
  responsable: string;
  arrondissement: string;
  rue: string;
  de: string;
  a: string;
  precision: string;
  phase: string;
  codeActif: string;
  actif: string;
  codeTravaux: string;
  travaux: string;
  quantiteProjet: number;
  typeQuantite: string;
  codeExecutant: string;
  executant: string;
  anneeDebutTravaux: number;
  anneeFinTravaux: number;
  budget: number;
  carnet: string;
  descriptionCarnet: string;
  codeStatutCarnet: string;
  statutCarnet: string;
  dateMAJProjet: Date;
  comparaison: string;
  geom: string;
  assets?: Asset[];
  comments?: IInterventionSEComment[];
  agirIntervention?: IEnrichedIntervention;
  agirWorkTypeId?: string;
  agirAssetTypeId?: string;
}

interface INexoBookProgram {
  year: number;
  programId: string;
}

export class InterventionSERow extends NexoRow<IInterventionSEHeaders> {
  public get iDActif(): string {
    return this.stringOrUndefined(this.props.iDActif);
  }
  public get diametre(): string {
    return this.stringOrUndefined(this.props.diametre);
  }
  public get materiau(): string {
    return this.stringOrUndefined(this.props.materiau);
  }
  public get dateInstallation(): number {
    return this.props.dateInstallation;
  }
  public get longueurExistant(): number {
    return this.props.longueurExistant;
  }
  public get longueurIntervention(): number {
    return this.props.longueurIntervention;
  }
  public get pourcentage(): number {
    return this.props.pourcentage;
  }
  public get versionPI(): number {
    return this.props.versionPI;
  }
  public get noDossierSE(): string {
    return this.stringOrUndefined(this.props.noDossierSE);
  }
  public get codePhase(): string {
    return this.stringOrUndefined(this.props.codePhase);
  }
  public get uniteResponsable(): string {
    return this.stringOrUndefined(this.props.uniteResponsable);
  }
  public get responsable(): string {
    return this.stringOrUndefined(this.props.responsable);
  }
  public get arrondissement(): string {
    return this.stringOrUndefined(this.props.arrondissement);
  }
  public get rue(): string {
    return this.stringOrUndefined(this.props.rue);
  }
  public get de(): string {
    return this.stringOrUndefined(this.props.de);
  }
  public get a(): string {
    return this.stringOrUndefined(this.props.a);
  }
  public get precision(): string {
    return this.stringOrUndefined(this.props.precision);
  }
  public get phase(): string {
    return this.stringOrUndefined(this.props.phase);
  }
  public get codeActif(): string {
    return this.stringOrUndefined(this.props.codeActif);
  }
  public get actif(): string {
    return this.stringOrUndefined(this.props.actif);
  }
  public get codeTravaux(): string {
    return this.stringOrUndefined(this.props.codeTravaux);
  }
  public get travaux(): string {
    return this.stringOrUndefined(this.props.travaux);
  }
  public get quantiteProjet(): number {
    return this.props.quantiteProjet;
  }
  public get typeQuantite(): string {
    return this.stringOrUndefined(this.props.typeQuantite);
  }
  public get codeExecutant(): string {
    return this.stringOrUndefined(this.props.codeExecutant);
  }
  public get executant(): string {
    return this.stringOrUndefined(this.props.executant);
  }
  public get anneeDebutTravaux(): number {
    return this.props.anneeDebutTravaux;
  }
  public get anneeFinTravaux(): number {
    return this.props.anneeFinTravaux;
  }
  public get budget(): number {
    return this.props.budget;
  }
  public get carnet(): string {
    return this.stringOrUndefined(this.props.carnet);
  }
  public get descriptionCarnet(): string {
    return this.stringOrUndefined(this.props.descriptionCarnet);
  }
  public get codeStatutCarnet(): string {
    return this.stringOrUndefined(this.props.codeStatutCarnet);
  }
  public get statutCarnet(): string {
    return this.stringOrUndefined(this.props.statutCarnet);
  }
  public get dateMAJProjet(): Date {
    return new Date(this.props.dateMAJProjet);
  }
  public get comparaison(): string {
    return this.stringOrUndefined(this.props.comparaison);
  }
  public get geom(): IGeometry {
    if (typeof this.props.geom === 'object') {
      return this.props.geom;
    }
    return JSON.parse(this.props.geom);
  }
  public get assets(): Asset[] {
    return this.props.assets;
  }
  public get comments(): IInterventionSEComment[] {
    return this.props.comments;
  }
  public get agirIntervention(): IEnrichedIntervention {
    return this.props.agirIntervention;
  }
  public get modificationType(): ModificationType {
    if (this.isDeletion()) {
      return ModificationType.DELETION;
    }
    if (this.isModification()) {
      return ModificationType.MODIFICATION;
    }
    if (this.status !== NexoImportStatus.FAILURE && !this.props.modificationType) {
      return ModificationType.CREATION;
    }
    return this.props.modificationType;
  }
  public get agirWorkTypeId(): string {
    return this.props.agirWorkTypeId;
  }
  public get agirAssetTypeId(): string {
    return this.props.agirAssetTypeId;
  }
  public static create(props: IInterventionSEHeaders): Result<InterventionSERow> {
    const guardResult = Guard.combine([NexoRow.guard(props), InterventionSERow.guard(props)]);
    if (!guardResult.succeeded) {
      const id = props?.comparaison ? props.comparaison : NO_ID_PROVIDED;
      return Result.fail<InterventionSERow>(NexoRow.guardResultToNexoFileErrors(guardResult, props, id));
    }
    const interventionSERow = new InterventionSERow(props);
    return Result.ok<InterventionSERow>(interventionSERow);
  }

  public static guard(props: IInterventionSEHeaders): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.dateMAJProjet,
        argumentName: `dateMAJProjet`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_DATE]
      },
      {
        argument: props.noDossierSE,
        argumentName: `noDossierSE`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.uniteResponsable,
        argumentName: `uniteResponsable`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.arrondissement,
        argumentName: `arrondissement`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.codeActif,
        argumentName: `codeActif`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.codeTravaux,
        argumentName: `codeTravaux`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.codeExecutant,
        argumentName: `codeExecutant`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.anneeDebutTravaux,
        argumentName: `anneeDebutTravaux`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.anneeFinTravaux,
        argumentName: `anneeFinTravaux`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.comparaison,
        argumentName: `comparaison`,
        guardType: [GuardType.NULL_OR_UNDEFINED]
      },
      {
        argument: props.geom,
        argumentName: `geom`,
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_GEOMETRY]
      },
      {
        argument: props.modificationType,
        argumentName: `modificationType`,
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(ModificationType)
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public static getDefaultAnnualDistribution(
    anneeDebutTravaux: number,
    anneeFinTravaux: number,
    allowance: number,
    totalLength: number,
    agirIntervention?: IEnrichedIntervention
  ): IInterventionAnnualDistribution {
    const years = range(anneeDebutTravaux, anneeFinTravaux + 1);
    const annualDistribution: IInterventionAnnualDistribution = {
      annualPeriods: []
    };
    for (const [rank, year] of years.entries()) {
      const accountId = agirIntervention?.annualDistribution?.annualPeriods?.find(period => period.year === year)
        ?.accountId;
      annualDistribution.annualPeriods.push({
        rank,
        year,
        annualAllowance: anneeDebutTravaux === anneeFinTravaux ? allowance : 0,
        annualLength: anneeDebutTravaux === anneeFinTravaux ? totalLength / 1000 : 0,
        accountId: accountId ? accountId : 0
      });
    }

    annualDistribution.distributionSummary = interventionAnnualDistributionService.generateDistributionSummary(
      annualDistribution,
      agirIntervention?.annualDistribution?.distributionSummary?.note
    );

    return annualDistribution;
  }

  constructor(props: IInterventionSEHeaders) {
    super(props);
    if (isEmpty(props.assets)) {
      props.assets = [];
    }
    if (isEmpty(props.comments)) {
      props.comments = [];
    }
  }
  public setAgirIntervention(agirIntervention: IEnrichedIntervention): void {
    this.props.agirIntervention = agirIntervention;
  }
  public setModificationType(modificationType: ModificationType): void {
    this.props.modificationType = modificationType;
  }
  public setAgirWorkTypeId(agirWorkTypeId: string): void {
    this.props.agirWorkTypeId = agirWorkTypeId;
  }
  public setAgirAssetTypeId(agirAssetTypeId: string): void {
    this.props.agirAssetTypeId = agirAssetTypeId;
  }

  // is considered as deletion if is NEXO_CANCELLED and existingAssets - assetGeom is empty
  public isDeletion() {
    return this.status !== NexoImportStatus.FAILURE && this.codePhase === NEXO_CODE_PHASE_CANCELED;
  }

  public isModification() {
    if (this.status !== NexoImportStatus.FAILURE) {
      const existingAssets = this.agirIntervention ? this.agirIntervention.assets : [];
      return !isEmpty(
        existingAssets.filter(asset =>
          asset.externalReferenceIds.find(
            extId =>
              extId.type === InterventionExternalReferenceType.nexoReferenceNumber && extId.value === this.comparaison
          )
        )
      );
    }
    return false;
  }

  // map row elements to agir domain intervention
  // tslint:disable-next-line: max-func-body-length
  public async toIntervention(assets: Asset[], comments: IInterventionSEComment[]): Promise<NexoIntervention> {
    const [workType, requestor, borough, executor] = await Promise.all(
      [
        {
          nexoCode: this.codeTravaux,
          group: TaxonomyGroup.workType
        },
        {
          nexoCode: this.uniteResponsable,
          group: TaxonomyGroup.requestor
        },
        {
          nexoCode: this.arrondissement,
          group: TaxonomyGroup.borough
        },
        {
          nexoCode: this.codeExecutant,
          group: TaxonomyGroup.executor
        }
      ].map(s => NexoImportFileValidator.findTaxonomyByNexoType(s.nexoCode, s.group))
    );
    const [nexoBook, interventionName] = await Promise.all([
      await taxonomyService.getTaxonomy(TaxonomyGroup.nexoBook, this.carnet),
      await interventionService.generateInterventionName(workType.code, assets.find(a => a)?.typeId, this.rue)
    ]);
    let workArea: Feature<Polygon | MultiPolygon>;
    const roadSections: IFeatureCollection = undefined;
    let interventionArea: IInterventionArea;
    // Enrich only if not deletion
    if (this.modificationType !== ModificationType.DELETION) {
      workArea = await workAreaService.getPolygonFromGeometries(assets.map(asset => asset.geometry));
      interventionArea = {
        geometry: workArea.geometry,
        geometryPin: interventionService.getGeometryPin(workArea.geometry)
      };
    }
    const audit = Audit.fromCreateContext();
    const programId = this.getProgramId(nexoBook);
    const commentsCreated = this.getCommentsFromInterventionSEComments(comments, audit);

    // handle previous comments
    this.agirIntervention?.comments?.forEach(comment => {
      if (!commentsCreated.find(item => item.categoryId === comment.categoryId && item.text === comment.text)) {
        commentsCreated.push(
          Comment.create(
            {
              ...comment,
              audit: Audit.generateAuditFromIAudit(comment.audit)
            },
            comment.id
          ).getValue()
        );
      }
    });

    // handle previous documents
    const documents: DocumentIntervention[] = this.agirIntervention?.documents?.map(document => {
      return DocumentIntervention.create({
        ...document,
        objectId: (document as any).objectId,
        isProjectVisible: document.isProjectVisible ? document.isProjectVisible : false,
        notes: document.notes,
        type: document.type ? (document.type as DocumentType) : DocumentType.other,
        validationStatus: document.validationStatus
          ? (document.validationStatus as DocumentStatus)
          : DocumentStatus.validated,
        audit: Audit.generateAuditFromIAudit(document.audit)
      }).getValue();
    });

    const externalReferenceId = ExternalReferenceId.create({
      type: InterventionExternalReferenceType.nexoReferenceNumber,
      value: this.noDossierSE
    }).getValue();
    const interventionId = this.agirIntervention?.id;

    const estimate = this.computeInterventionEstimate();

    const totalLength = assets?.map(asset => asset?.length?.value).reduce((sum, current) => sum + current, 0);
    // Set default annualDistribution and see what happens
    const annualDistribution: IInterventionAnnualDistribution = InterventionSERow.getDefaultAnnualDistribution(
      this.anneeDebutTravaux,
      this.anneeFinTravaux,
      estimate.allowance,
      totalLength ? totalLength : 0,
      this.agirIntervention
    );

    const modificationSummary = this.getModificationsSummary(
      assets,
      requestor.code,
      workType.code,
      executor.code,
      borough.code,
      programId
    );

    // handle previous decisions
    const decisions: IInterventionDecision[] = this.agirIntervention?.decisions ? this.agirIntervention.decisions : [];
    const revisionRequest = this.getRevisionRequest(programId, modificationSummary);
    if (revisionRequest) {
      decisions.push(revisionRequest);
    }

    const newStatus = this.computeInterventionStatus(executor, programId, revisionRequest);
    const wasCanceled =
      this.agirIntervention?.status === InterventionStatus.canceled && newStatus !== this.agirIntervention?.status;

    const nexoInterventionProps: INexoInterventionProps = {
      interventionName,
      interventionTypeId: InterventionType.initialNeed,
      workTypeId: workType.code,
      requestorId: requestor.code,
      executorId: executor.code,
      boroughId: borough.code,
      status: newStatus,
      interventionYear: this.anneeDebutTravaux,
      planificationYear: this.anneeDebutTravaux,
      estimate,
      programId: !isNil(programId) ? programId : null,
      contact: this.responsable,
      medalId: undefined,
      project: undefined,
      comments: commentsCreated,
      documents,
      externalReferenceIds: [externalReferenceId],
      roadNetworkTypeId: undefined,
      decisions: !isEmpty(decisions) ? decisions : undefined,
      decisionRequired: this.getIsDecisionRequired(programId, revisionRequest, wasCanceled),
      assets,
      interventionArea,
      roadSections,
      streetName: this.rue,
      streetFrom: this.de,
      streetTo: this.a,
      annualDistribution,
      endYear: this.anneeFinTravaux,
      importRevisionDate: this.dateMAJProjet.toISOString(),
      lineNumber: this.lineNumber,
      audit,
      modificationType: this.modificationType,
      interventionId,
      codeStatusCarnet: this.codeStatutCarnet,
      codePhase: this.codePhase,
      modificationSummary
    };
    return NexoIntervention.create(nexoInterventionProps, interventionId).getValue();
  }

  public toNexoLogIntervention(): NexoLogIntervention {
    return NexoLogIntervention.create(
      {
        ...this.toNexoLogElementProps(),
        lineNumber: this.lineNumber
      },
      this.comparaison
    ).getValue();
  }

  private computeInterventionStatus(executor: ITaxonomy, programId: string, revisionRequest: IInterventionDecision) {
    if (
      this.agirIntervention?.programId &&
      programId &&
      !revisionRequest &&
      this.agirIntervention?.status !== InterventionStatus.canceled
    ) {
      return this.agirIntervention.status;
    }

    if (this.codeStatutCarnet === NEXO_CODE_STATUS_CARNET_RECEIVED) {
      if (executor.code === EXECUTOR_DI) {
        return InterventionStatus.waiting;
      }
      return programId ? InterventionStatus.waiting : InterventionStatus.integrated;
    }
    return InterventionStatus.wished;
  }

  private computeInterventionEstimate(): IBudget {
    const value = this.budget ? this.budget / 1000 : 0; // from $ to k$
    return {
      allowance: value,
      burnedDown: 0,
      balance: value
    };
  }

  private getCommentsFromInterventionSEComments(comments: IInterventionSEComment[], audit: Audit): Comment[] {
    return comments
      .map(props => {
        const result = Comment.create({
          categoryId: 'requestor',
          text: props.text,
          isPublic: false,
          isProjectVisible: true,
          audit
        });
        if (result.isSuccess) {
          return result.getValue();
        }
        return null;
      })
      .filter(c => !isNil(c));
  }

  public getProgramId(nexoBook: ITaxonomy): string {
    if (!nexoBook) {
      return undefined;
    }
    const programs = nexoBook.properties?.programs as INexoBookProgram[];
    // get program matching anneeDebutTravaux ?
    const program = programs?.find(p => Number(p.year) === this.anneeDebutTravaux);
    return program?.programId;
  }

  private getModificationsSummary(
    assets: Asset[],
    newRequestor: string,
    newWorkType: string,
    newExecutor: string,
    newBorough: string,
    newProgram: string
  ): IKeyAndValue<boolean> {
    if (!this.agirIntervention) {
      return null;
    }

    let assetsHasChanged = false;
    const oldNumberOfAssets = this.agirIntervention.assets.length;
    const newNumberOfAssets = assets.length;
    if (oldNumberOfAssets !== newNumberOfAssets) {
      assetsHasChanged = true;
    } else {
      for (const asset of this.agirIntervention.assets) {
        const nexoReferenceNumber = asset.externalReferenceIds?.find(
          ext => ext.type === ExternalReferenceType.nexoReferenceNumber
        ).value;

        const result = assets.find(
          item => item.getExternalReferenceIdValue(ExternalReferenceType.nexoReferenceNumber) === nexoReferenceNumber
        );
        if (!result) {
          assetsHasChanged = true;
          break;
        }
      }
    }

    return {
      assetsHasChanged,
      requestorIdHasChanged: this.agirIntervention.requestorId !== newRequestor,
      workTypeIdHasChanged: this.agirIntervention.workTypeId !== newWorkType,
      programIdHasChanged: this.agirIntervention.programId !== newProgram,
      planificationYearHasChanged: this.agirIntervention.planificationYear !== this.anneeDebutTravaux,
      endYearHasChanged: this.agirIntervention.endYear !== this.anneeFinTravaux,
      executorIdHasChanged: this.agirIntervention.executorId !== newExecutor,
      boroughIdHasChanged: this.agirIntervention.boroughId !== newBorough
    };
  }

  private getRevisionRequest(newProgram: string, modificationSummary: IKeyAndValue<boolean>): IInterventionDecision {
    if (
      !this.agirIntervention?.programId ||
      !newProgram ||
      [InterventionStatus.canceled, InterventionStatus.waiting, InterventionStatus.wished].includes(
        this.agirIntervention.status as InterventionStatus
      )
    ) {
      return null;
    }
    const revisionRequestLabels: IKeyAndValue<string> = {
      default: 'Une nouvelle décision est requise.',
      assetsHasChanged: " Un actif a été ajouté ou supprimé de l'intervention.",
      requestorIdHasChanged: " Le requérant de l'intervention a été modifié.",
      workTypeIdHasChanged: " Le type de travaux de l'intervention a été modifié.",
      programIdHasChanged: " Le programme de l'intervention a été modifié.",
      planificationYearHasChanged: " L'année de début des travaux de l'intervention a été modifié.",
      endYearHasChanged: " L'année de réalisation des travaux de l'intervention a été modifié."
    };

    const getRevisionRequestLabel = (key: string, condition: boolean): string => {
      return condition && revisionRequestLabels[key] ? revisionRequestLabels[key] : '';
    };

    // tslint:disable:no-string-literal
    let textValue = '';
    Object.keys(modificationSummary).forEach(key => {
      textValue += getRevisionRequestLabel(key, modificationSummary[key]);
    });

    return isEmpty(textValue)
      ? null
      : {
          audit: auditService.buildAudit(),
          typeId: InterventionDecisionType.revisionRequest,
          text: `${revisionRequestLabels['default']}${textValue}`,
          targetYear: this.agirIntervention.planificationYear,
          previousPlanificationYear: this.agirIntervention.planificationYear
        };
  }

  private getIsDecisionRequired(
    programId: string,
    revisionRequest: IInterventionDecision,
    wasCanceled: boolean
  ): boolean {
    if (revisionRequest || (wasCanceled && programId)) {
      return true;
    }

    if (this.agirIntervention && this.agirIntervention.programId && programId && !revisionRequest) {
      return this.agirIntervention.decisionRequired;
    }

    return programId ? true : false;
  }
}

export function getInterventionSESheetToJSONOptions(opts?: ISheet2JSONOpts): ISheet2JSONOpts {
  return {
    dateNF: AuthorizedDateFormats.MILLISECONDS_WITH_SPACE,
    ...opts
  };
}

export const minimalInterventionSE: IInterventionSEHeaders = {
  ...minimalNexoRow,
  iDActif: '',
  diametre: '159',
  materiau: 'Fonte grise',
  dateInstallation: 1984,
  longueurExistant: 101.4,
  longueurIntervention: 101.4,
  pourcentage: 50,
  versionPI: 1,
  noDossierSE: NO_DOSSIER_SE,
  codePhase: CANCEL_NEXO_PHASE_CODE,
  uniteResponsable: 'DRE-Section Sud',
  responsable: '',
  arrondissement: 'Anjou',
  rue: 'sherbrooke',
  de: 'saint-laurent',
  a: 'saint-denis',
  precision: 'This is a comment',
  phase: '',
  codeActif: AQUEDUCT_SEGMENT_NEXO_ASSET_CODE,
  actif: 'Aqueduc',
  codeTravaux: RECONSTRUCTION_NEXO_WORK_TYPE_CODE,
  travaux: 'Reconstruction',
  quantiteProjet: 1,
  typeQuantite: '',
  codeExecutant: DI_NEXO_EXECUTOR_CODE,
  executant: 'DI',
  anneeDebutTravaux: appUtils.getCurrentYear(),
  anneeFinTravaux: appUtils.getCurrentYear() + 1,
  budget: 10,
  carnet: NEXO_CARNET,
  descriptionCarnet: `Réhabilitation aqueduc ${appUtils.getCurrentYear()} DI`,
  codeStatutCarnet: PUBLISHED_NEXO_BOOK_STATUS_CODE,
  statutCarnet: '',
  dateMAJProjet: new Date('2012-12-17 00:00:00.000'),
  comparaison: 'ComparaisonId',
  geom: `{
    "type": "LineString",
    "coordinates": [[-73.56006771326065, 45.49876714523858], [-73.55963587760925, 45.49922586978999]]
  }`
};
