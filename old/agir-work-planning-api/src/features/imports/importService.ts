import * as turf from '@turf/turf';
import {
  CommentCategory,
  IApiError,
  IBicProject,
  IComment,
  IEnrichedIntervention,
  IEnrichedProject,
  IFeature,
  InterventionExternalReferenceType,
  InterventionStatus,
  InterventionType,
  IPlainIntervention,
  IPlainProject,
  ProjectExternalReferenceType,
  ProjectStatus,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { isNil, remove, uniqBy } from 'lodash';
import { Types } from 'mongoose';

import { constants } from '../../../config/constants';
import { annualDistributionServiceFactory } from '../../factories/annualDistributionServiceFactory';
import { geolocatedAnnualDistributionService } from '../../services/annualDistribution/geolocatedAnnualDistributionService';
import { interventionAnnualDistributionService } from '../../services/annualDistribution/interventionAnnualDistributionService';
import { assetService } from '../../services/assetService';
import { auditService } from '../../services/auditService';
import { projectMedalService } from '../../services/projectMedalService';
import { spatialAnalysisService } from '../../services/spatialAnalysisService';
import { errorMtlMapper } from '../../shared/domainErrors/errorMapperMtlApi';
import { InvalidParameterError } from '../../shared/domainErrors/invalidParameterError';
import { Result } from '../../shared/logic/result';
import { REQUIREMENT_TYPE_OTHER_REQUIREMENTS } from '../../shared/taxonomies/constants';
import { createInvalidInputError } from '../../utils/errorUtils';
import { openApiInputValidator } from '../../utils/openApiInputValidator';
import { Audit } from '../audit/audit';
import { interventionService } from '../interventions/interventionService';
import { interventionValidator } from '../interventions/validators/interventionValidator';
import { LengthUnit } from '../length/models/length';
import { ProgramBook } from '../programBooks/models/programBook';
import { projectService } from '../projects/projectService';
import { Requirement } from '../requirements/models/requirement';
import { RequirementItem } from '../requirements/models/requirementItem';
import { requirementRepository } from '../requirements/mongo/requirementRepository';
import { taxonomyService } from '../taxonomies/taxonomyService';
import { ImportFlag } from './enums/importFlag';
import { IImportRelation } from './mongo/projectImportRelationSchema';

class ImportService {
  /**
   * Validates the BIC project. If it's invalid, we throw exceptions.
   * @param bicProject The BIC project to be imported.
   */
  public async validateBicProjects(bicProjects: IBicProject[]): Promise<void> {
    const errors: IApiError[] = [];

    if (!bicProjects || !bicProjects.length) {
      throw createInvalidInputError('The BIC projects are empty.');
    }

    for (const bicProject of bicProjects) {
      await openApiInputValidator.validateInputModel(errors, 'BicProject', bicProject, true);
    }

    const id = bicProjects[0].ID_PROJET;
    if (!bicProjects.every(x => x.ID_PROJET === id)) {
      throw createInvalidInputError('The BIC projects\' "ID_PROJET" must all be the same.');
    }

    if (bicProjects.every(x => x.TYPE_INTERVENTION !== 'initialNeed')) {
      throw createInvalidInputError(
        'The BIC projects must have at least 1 project with TYPE_INTERVENTION = "initialNeed".'
      );
    }

    if (errors.length) {
      throw createInvalidInputError('The BIC projects are invalid.', errors);
    }
  }

  /**
   * Validates the BIC project. If it's invalid, we throw exceptions.
   * @param importProjectRequest The BIC project to be imported.
   */
  public async validateBicProjectsFeatures(features: IFeature[]): Promise<void> {
    const errors: IApiError[] = [];

    if (!features || !features.length) {
      throw createInvalidInputError('The BIC projects features are empty.');
    }

    for (const feature of features) {
      await openApiInputValidator.validateInputModel(errors, 'Feature', feature, true);
    }

    if (errors.length) {
      throw createInvalidInputError('The BIC projects features are invalid.', errors);
    }
  }

  /**
   * Creates an intervention that will be linked to the project.
   * The intervention area will equal to the project's one.
   * @param bicProject The BIC project
   */
  public async createInterventions(
    bicProjects: IBicProject[],
    project: IEnrichedProject,
    workAreaFeature: turf.Feature<turf.Polygon>
  ): Promise<IEnrichedIntervention[]> {
    const roadSections = await assetService.getRoadSections(turf.feature(workAreaFeature.geometry));
    const programTypeCodes = (await taxonomyService.getGroup(TaxonomyGroup.programType)).map(x => x.code);
    const interventions: IEnrichedIntervention[] = [];
    let intervention: IEnrichedIntervention;
    for (const bicProject of bicProjects) {
      const startYear = bicProject.ANNEE_DEBUT ? parseInt(bicProject.ANNEE_DEBUT, 10) : null;

      intervention = {
        interventionName: '',
        interventionTypeId: bicProject.TYPE_INTERVENTION || 'initialNeed',
        workTypeId: bicProject.TYPE_TRAVAUX_AGIR || 'construction',
        requestorId: bicProject.REQUERANT_AGIR,
        executorId: bicProject.EXECUTANT_AGIR,
        boroughId: bicProject.ARRONDISSEMENT_AGIR || 'MTL',
        status: bicProject.STATUT_INTERVENTION || InterventionStatus.waiting,
        interventionYear: startYear,
        planificationYear: startYear,
        estimate: {
          allowance: this.getEstimationNumber(bicProject.ESTIMATION_REQUERANT),
          burnedDown: 0,
          balance: this.getEstimationNumber(bicProject.ESTIMATION_REQUERANT)
        },
        programId: programTypeCodes.includes(bicProject.PROGRAMME) ? bicProject.PROGRAMME : undefined,
        medalId: bicProject.TYPE_ACTIF_AGIR === 'amenagement' ? bicProject.MEDAILLE_AMENAGEMENT : undefined,
        contact: null,
        assets: [
          {
            typeId: bicProject.TYPE_ACTIF_AGIR ? bicProject.TYPE_ACTIF_AGIR : 'undefined',
            ownerId: bicProject.PROPRIETAIRE_ACTIF,
            geometry: workAreaFeature.geometry,
            roadSections,
            length: { value: this.getLength(bicProject.LONGUEUR_INTERV_REQUERANT), unit: LengthUnit.meter }
          }
        ],
        interventionArea: {
          geometry: workAreaFeature.geometry,
          geometryPin: interventionService.getGeometryPin(workAreaFeature.geometry)
        },
        importFlag: ImportFlag.internal,
        audit: auditService.buildSystemAudit(),
        streetName: bicProject.NOM_VOIE,
        streetFrom: bicProject.VOIE_DE,
        streetTo: bicProject.VOIE_A,
        externalReferenceIds: [
          { type: InterventionExternalReferenceType.requestorReferenceNumber, value: bicProject.NO_REFERENCE_REQ }
        ],
        roadNetworkTypeId: project.roadNetworkTypeId
      };
      intervention.roadSections = roadSections;
      intervention.assets[0].suggestedStreetName =
        bicProject.NOM_VOIE || spatialAnalysisService.getSuggestedName(roadSections);
      intervention.interventionName = await interventionService.generateInterventionName(
        intervention.workTypeId,
        intervention.assets[0].typeId,
        intervention.streetName
      );

      // add annual allowance of each intervention
      this.createInterventionAnnualPeriods(intervention, project);
      this.addInterventionAnnualPeriodsAllowance(intervention, bicProject);

      await interventionValidator.validateImport(intervention);

      interventions.push(intervention);
    }
    return interventions;
  }

  /**
   * Adds properties to the project then validate it
   * @returns the updated project
   */
  public async updateProject(
    project: IEnrichedProject,
    interventions: IEnrichedIntervention[],
    comments: IComment[]
  ): Promise<IEnrichedProject> {
    let updatedProject = project;
    updatedProject = await this.addImportedComments(updatedProject, comments);
    await projectMedalService.setMedalToProject(updatedProject, interventions);
    updatedProject.length = projectService.getProjectLength(interventions);
    updatedProject.interventions = interventions;
    return updatedProject;
  }

  /**
   * Add budget and programBookId to annualPeriods
   * @param project
   * @param bicProject
   */
  public async updateProjectAnnualPeriods(project: IEnrichedProject, bicProject: IBicProject): Promise<void> {
    await projectService.addAnnualPeriodsToProgramBooks(project);
    if (project.status === ProjectStatus.programmed) {
      for (let i = 0; i < project.annualDistribution.annualPeriods.length; i++) {
        if (!project.annualDistribution.annualPeriods[i].programBookId && i === 0) {
          throw errorMtlMapper.toApiError(
            new InvalidParameterError(
              Result.fail(
                `Project with status ${ProjectStatus.programmed} must be program in a program book. BicNoProject : ${bicProject.NO_PROJET}`
              )
            )
          );
        }
        if (
          i > 0 &&
          project.annualDistribution.annualPeriods[i].programBookId &&
          !project.annualDistribution.annualPeriods[i - 1].programBookId
        ) {
          throw errorMtlMapper.toApiError(
            new InvalidParameterError(
              Result.fail(
                `Project with status ${ProjectStatus.programmed} must be program in a program book in previous annualPeriod. BicNoProject : ${bicProject.NO_PROJET}`
              )
            )
          );
        }
      }
    }
  }

  public createInterventionAnnualPeriods(intervention: IEnrichedIntervention, project: IEnrichedProject): void {
    if (!intervention || projectService.isProjectNonGeolocated(project)) {
      return;
    }
    interventionAnnualDistributionService.generateAnnualPeriodFromProjectAnnualPeriods(
      [intervention],
      project.annualDistribution.annualPeriods
    );
    interventionAnnualDistributionService.createDistributionSummary([intervention]);
  }

  private addInterventionAnnualPeriodsAllowance(intervention: IEnrichedIntervention, bicProject: IBicProject): void {
    intervention.annualDistribution.annualPeriods.forEach((ap, index) => {
      const annualAllowance = this.getEstimationNumber(bicProject[`BUDGET_ANNEE_${index + 1}`]);
      ap.annualAllowance = ap.rank === index ? annualAllowance : 0;
    });
  }

  /**
   * Update Interventions Comments
   * @param interventions
   * @param bicProjects
   */
  public updateInterventionsComments(interventions: IEnrichedIntervention[], bicProjects: IBicProject[]): void {
    interventions
      .filter(
        intervention =>
          intervention.interventionYear &&
          intervention.streetName &&
          intervention.streetFrom &&
          intervention.streetTo &&
          intervention.workTypeId &&
          intervention.assets[0].typeId
      )
      .forEach(intervention => {
        const bicProjectList = bicProjects.filter(
          bicProject =>
            +bicProject.ANNEE_DEBUT === intervention.interventionYear &&
            bicProject.NOM_VOIE === intervention.streetName &&
            bicProject.VOIE_DE === intervention.streetFrom &&
            bicProject.VOIE_A === intervention.streetTo &&
            (bicProject.TYPE_TRAVAUX_AGIR || 'construction') === intervention.workTypeId &&
            (bicProject.TYPE_ACTIF_AGIR || 'undefined') === intervention.assets[0].typeId &&
            bicProject.COMMENTAIRE_INTERVENTION !== ''
        );
        if (bicProjectList.length > 0) {
          intervention.comments = [];
          for (const bicProject of bicProjectList) {
            intervention.comments.push(this.createInterventionComment(bicProject));
          }
          intervention.comments = intervention.comments.filter(comment => comment !== null);
        }
        return intervention;
      });
  }

  public createComments(bicProjects: IBicProject[]): IComment[] {
    const comments: IComment[] = [];
    this.generateProjectsComments(bicProjects, comments);
    this.generateInformationProjectsComments(bicProjects, comments);
    this.generateRequestorProjectsComments(bicProjects, comments);
    this.generateHistoricProjectsComments(bicProjects, comments);
    this.generateConstraintProjectsComments(bicProjects, comments);
    return this.getUniqueComments(comments);
  }

  private createComment(
    bicProjects: IBicProject[],
    comments: IComment[],
    commentKey: string,
    categoryId: string,
    isPublic: boolean
  ): void {
    bicProjects
      .filter(bicProject => bicProject[commentKey])
      .forEach(bicProject => {
        comments.push({
          id: Types.ObjectId().toString(),
          categoryId,
          text: bicProject[commentKey],
          isPublic,
          audit: auditService.buildSystemAudit()
        });
      });
  }

  private createInterventionComment(bicProject: IBicProject): IComment {
    if (!bicProject.COMMENTAIRE_INTERVENTION || bicProject.COMMENTAIRE_INTERVENTION.trim() === '') {
      return null;
    }
    return this.generateImportInterventionComment(bicProject.COMMENTAIRE_INTERVENTION.trim());
  }

  public getInterventionBicProjects(bicProjects: IBicProject[]): IBicProject[] {
    return bicProjects.filter(bicProject => !bicProject.COMMENTAIRE_PROJET);
  }

  public addInterventionsToProject(interventions: IEnrichedIntervention[], project: IEnrichedProject) {
    project.interventionIds = interventions.map(x => x.id);
    geolocatedAnnualDistributionService.distributeInterventions(project, interventions);
    project.interventions = interventions;
  }

  public addProjectToInterventions<T extends IPlainIntervention | IEnrichedIntervention>(
    interventions: T[],
    project: IPlainProject | IEnrichedProject
  ): T[] {
    const obj: IEnrichedIntervention = {
      project: {
        id: project.id,
        typeId: project.projectTypeId
      }
    } as IEnrichedIntervention;
    const updatedInterventions: T[] = [];
    for (const intervention of interventions) {
      updatedInterventions.push(Object.assign({}, intervention, obj));
    }
    return updatedInterventions;
  }

  public async addProjectRequirements(project: IEnrichedProject, bicProjects: IBicProject[]): Promise<void> {
    const requirements: Requirement[] = [];
    const bicProjectsWithRequirement = bicProjects.filter(
      bicProject => bicProject.PROJET_EXIGENCE && bicProject.TYPE_INTERVENTION === InterventionType.initialNeed
    );

    for (const bicProject of bicProjectsWithRequirement) {
      requirements.push(...(await this.generateProjectRequirement(project, bicProject.PROJET_EXIGENCE)));
    }

    if (requirements.length) {
      await requirementRepository.saveBulk(await this.getUniqueRequirements(requirements));
    }
  }

  /**
   * Creates a project from the BIC project.
   * @param bicProject The BIC project
   */
  public async createProject(
    bicProject: IBicProject,
    workAreaGeometry: turf.Feature<turf.Polygon>
  ): Promise<IEnrichedProject> {
    const roadNetworkTypeId = await spatialAnalysisService.getRoadNetworkType(turf.feature(workAreaGeometry.geometry));
    const projectName = `${bicProject.NO_PROJET} - ${bicProject.TITRE_PROJET || constants.strings.NA}`;

    const project: IEnrichedProject = {
      projectName,
      projectTypeId: bicProject.TYPE_PROJET,
      boroughId: bicProject.ARRONDISSEMENT_AGIR,
      status: bicProject.STATUT_PROJET,
      executorId: bicProject.EXECUTANT_AGIR,
      startYear: +bicProject.ANNEE_DEBUT,
      endYear: +bicProject.ANNEE_FIN,
      streetName: bicProject.PROJET_NOM_VOIE,
      streetFrom: bicProject.PROJET_VOIE_DE,
      streetTo: bicProject.PROJET_VOIE_A,
      interventionIds: [undefined],
      geometry: workAreaGeometry.geometry,
      geometryPin: projectService.getGeometryPin(workAreaGeometry?.geometry),
      importFlag: ImportFlag.internal,
      globalBudget: {
        allowance: this.getEstimationNumber(bicProject.ESTIMATION_BUDG_GLOBAL)
      },
      audit: auditService.buildSystemAudit(),
      externalReferenceIds: [
        { type: ProjectExternalReferenceType.infoRTUReferenceNumber, value: bicProject.NO_PROJET }
      ],
      roadNetworkTypeId
    };

    const annualDistributionService = annualDistributionServiceFactory.getService(project);
    const annualPeriodsStatus = this.getAnnualPeriodsStatus(project);
    project.annualDistribution = annualDistributionService.createAnnualDistribution(
      Object.assign({}, project, { status: annualPeriodsStatus })
    );

    return project;
  }

  /**
   * Creates a relation model.
   * @param bicProject The BIC project
   * @param project The project
   * @param intervention The intervention
   */
  public createRelation(
    bicProjects: IBicProject[],
    project: IEnrichedProject,
    interventions: IEnrichedIntervention[]
  ): IImportRelation {
    let bicProjectId = bicProjects[0].ID_PROJET?.toString().trim();
    bicProjectId = bicProjectId?.length > 0 ? bicProjectId : undefined;
    const relation: IImportRelation = {
      bicProjectNumber: bicProjects[0].NO_PROJET.toString(),
      bicProjectId,
      interventions: [],
      projectId: project.id
    };

    for (let i = 0; i < bicProjects.length; i++) {
      const bicProject = bicProjects[i];
      const intervention = interventions[i];
      relation.interventions.push({
        interventionId: intervention.id,
        LONGUEUR_GLOBAL: bicProject.LONGUEUR_GLOBAL,
        LONGUEUR_INTERV_REQUERANT: bicProject.LONGUEUR_INTERV_REQUERANT,
        MEDAILLE_AMENAGEMENT: bicProject.MEDAILLE_AMENAGEMENT,
        NOM_ARRONDISSEMENT: bicProject.NOM_ARRONDISSEMENT,
        NO_PROJET: bicProject.NO_PROJET,
        TYPE_INTERVENTION: bicProject.TYPE_INTERVENTION
      });
    }

    return relation;
  }

  private getEstimationNumber(estimation: string | number): number {
    if (!estimation) {
      return 0;
    }
    if (typeof estimation === 'number') {
      return Math.floor(estimation / 1000);
    }
    return Math.floor(+estimation.replace(',', '.') / 1000);
  }

  /**
   * Converts BIC length to AGIR length
   * From kilometers to meters.
   * @param length The length in km
   */
  private getLength(length?: number): number {
    return length ? length * 1000 : 0;
  }

  private generateProjectsComments(bicProjects: IBicProject[], comments: IComment[]): void {
    const privateProjectComment: (keyof IBicProject)[] = ['COMMENTAIRE_PROJET'];
    const publicProjectComment: (keyof IBicProject)[] = ['COMMENTAIRE_ARRONDISSEMENT', 'COMMENTAIRE_MTQ_INFO_RTU'];
    const riskCommentKeys: (keyof IBicProject)[] = [
      'RISQUE_AUTRE_COMMENT',
      'RISQUE_ENFOUISS_COMMENT',
      'RISQUE_ACQUIS_TERRAIN',
      'RISQUE_ENTENTE'
    ];
    privateProjectComment.forEach(commentKey =>
      this.createComment(bicProjects, comments, commentKey, CommentCategory.information, false)
    );
    publicProjectComment.forEach(commentKey =>
      this.createComment(bicProjects, comments, commentKey, CommentCategory.information, true)
    );
    riskCommentKeys.forEach(commentKey =>
      this.createComment(bicProjects, comments, commentKey, CommentCategory.risk, true)
    );
  }

  private generateInformationProjectsComments(bicProjects: IBicProject[], comments: IComment[]): void {
    bicProjects
      .filter(
        bicProject =>
          bicProject.PROJET_COMMENTAIRE_INFO && bicProject.TYPE_INTERVENTION === InterventionType.initialNeed
      )
      .forEach(bicProject =>
        this.parseAddProjectComment(bicProject.PROJET_COMMENTAIRE_INFO, CommentCategory.information, comments)
      );
  }

  private generateRequestorProjectsComments(bicProjects: IBicProject[], comments: IComment[]): void {
    bicProjects
      .filter(
        bicProject => bicProject.PROJET_COMMENTAIRE_REQ && bicProject.TYPE_INTERVENTION === InterventionType.initialNeed
      )
      .forEach(bicProject =>
        this.parseAddProjectComment(bicProject.PROJET_COMMENTAIRE_REQ, CommentCategory.requestor, comments)
      );
  }

  private generateHistoricProjectsComments(bicProjects: IBicProject[], comments: IComment[]): void {
    bicProjects
      .filter(
        bicProject =>
          bicProject.PROJET_COMMENTAIRE_HISTO && bicProject.TYPE_INTERVENTION === InterventionType.initialNeed
      )
      .forEach(bicProject =>
        this.parseAddProjectComment(bicProject.PROJET_COMMENTAIRE_HISTO, CommentCategory.historic, comments)
      );
  }

  private generateConstraintProjectsComments(bicProjects: IBicProject[], comments: IComment[]): void {
    bicProjects
      .filter(
        bicProject => bicProject.PROJET_CONTRAINTE && bicProject.TYPE_INTERVENTION === InterventionType.initialNeed
      )
      .forEach(bicProject =>
        this.parseAddProjectComment(bicProject.PROJET_CONTRAINTE, CommentCategory.constraintDescription, comments)
      );
  }

  private generateProjectComment(
    text: string,
    comments: IComment[],
    categoryId?: CommentCategory,
    isPublic = false
  ): void {
    if (!text) {
      return;
    }
    comments.push({
      id: Types.ObjectId().toString(),
      categoryId: categoryId || CommentCategory.information,
      text,
      isPublic: isPublic || false,
      audit: auditService.buildSystemAudit()
    });
  }

  private parseAddProjectComment(commentToParse: string, categoryId: CommentCategory, comments: IComment[]): void {
    const commentDescriptions = commentToParse.split('||').map(comment => comment.trim());
    const isPublic = true;
    for (const commentDescription of commentDescriptions) {
      if (!commentDescription) {
        continue;
      }
      this.generateProjectComment(commentDescription, comments, categoryId, isPublic);
    }
  }

  private generateImportInterventionComment(commentDescription: string): IComment {
    return {
      id: Types.ObjectId().toString(),
      categoryId: CommentCategory.requestor,
      text: commentDescription,
      isPublic: true,
      audit: auditService.buildSystemAudit()
    };
  }

  private async generateProjectRequirement(
    project: IEnrichedProject,
    requirementToParse: string
  ): Promise<Requirement[]> {
    const requirements: Requirement[] = [];
    const requirementDescriptionList = requirementToParse.split('||');
    const requirementDescriptions = requirementDescriptionList.map(requirement => requirement.trim());
    const requirementSubTypes = await taxonomyService.getGroup(TaxonomyGroup.requirementSubtype);
    const subTypeTaxo = requirementSubTypes.find(item => item.code === REQUIREMENT_TYPE_OTHER_REQUIREMENTS);
    for (const text of requirementDescriptions) {
      if (!text) {
        continue;
      }
      requirements.push(
        Requirement.create({
          text,
          typeId: subTypeTaxo.properties.requirementType,
          subtypeId: REQUIREMENT_TYPE_OTHER_REQUIREMENTS,
          items: [
            RequirementItem.create({
              id: project.id,
              type: 'project'
            }).getValue()
          ],
          audit: auditService.buildSystemAudit() as Audit
        }).getValue()
      );
    }

    return requirements;
  }

  private getUniqueComments(comments: IComment[]): IComment[] {
    const filteredComments: IComment[] = [];
    for (const comment of comments) {
      let isDuplicate = false;
      for (const filteredComment of filteredComments) {
        if (
          comment.categoryId === filteredComment.categoryId &&
          comment.isPublic === filteredComment.isPublic &&
          comment.text === filteredComment.text
        ) {
          isDuplicate = true;
        }
      }
      if (!isDuplicate) {
        filteredComments.push(comment);
      }
    }
    return filteredComments;
  }

  private async getUniqueRequirements(requirements: Requirement[]): Promise<Requirement[]> {
    return uniqBy(requirements, r => r.typeId + r.subtypeId + r.text);
  }

  private getAnnualPeriodsStatus(project: IEnrichedProject): ProjectStatus {
    if (project.status === ProjectStatus.programmed) {
      return ProjectStatus.planned;
    }
    return project.status as ProjectStatus;
  }

  public async addImportedComments(project: IEnrichedProject, comments: IComment[]): Promise<IEnrichedProject> {
    const updatedProject: IEnrichedProject = project;
    if (isNil(updatedProject.comments)) {
      updatedProject.comments = [];
    }
    updatedProject.comments = [...updatedProject.comments, ...comments];
    return updatedProject;
  }

  public defineInChargeId(
    project: IEnrichedProject,
    bicProject: IBicProject,
    interventions: IEnrichedIntervention[]
  ): void {
    if (bicProject.DIVISION_REQUERANT_INITIAL) {
      project.inChargeId = bicProject.DIVISION_REQUERANT_INITIAL;
    } else {
      const intervention = interventions.find(interv => interv.interventionTypeId === InterventionType.initialNeed);
      project.inChargeId = intervention.requestorId;
    }
  }

  public removeProgramBookOrderProjectByProjectId(
    programBooksToRemoveOrderProject: ProgramBook[],
    removeProjectId: string
  ): void {
    for (const programBook of programBooksToRemoveOrderProject) {
      for (const priorityScenario of programBook.priorityScenarios) {
        remove(priorityScenario.orderedProjects, orderedProject => orderedProject.projectId === removeProjectId);
      }
    }
  }
}

export const importService = new ImportService();
