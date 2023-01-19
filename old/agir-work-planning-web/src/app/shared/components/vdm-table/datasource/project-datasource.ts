import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import {
  IEnrichedProject,
  IProjectPaginatedSearchRequest,
  IRequirement,
  ISubmission,
  Permission,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable } from 'rxjs';
import { ProjectConceptionRequirementComponent } from 'src/app/export/project-conception-requirement/project-conception-requirement.component';
import { ProjectLinkProjectsComponent } from 'src/app/export/project-link-projects/project-link-projects.component';
import { ProjectSubmissionNumberComponent } from 'src/app/export/project-submission-number/project-submission-number.component';
import { ProjectYearProgrambookComponent } from 'src/app/export/project-year-programbook/project-year-programbook.component';
import { PROJECT_FIELDS } from 'src/app/shared/models/findOptions/projectFields';
import { ProgramBookService } from 'src/app/shared/services/program-book.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { RequirementService } from 'src/app/shared/services/requirement.service';
import { SubmissionProjectService } from 'src/app/shared/services/submission-project.service';
import { IPaginatedResults } from '../../../models/paginated-results';
import { TaxonomyPipe } from '../../../pipes/taxonomies.pipe';
import { IVdmColumn } from '../vdm-table/vdm-table.component';
import { VdmDataSource } from './vdm-datasource';
export const DEFAULT_DISPLAYED_COLUMNS = ['_id', 'projectName', 'status', 'streetName', 'streetFrom', 'streetTo'];
@Injectable()
export class ProjectDataSource extends VdmDataSource<IEnrichedProject, IProjectPaginatedSearchRequest> {
  // tslint:disable-next-line: member-ordering
  public columns: IVdmColumn<IEnrichedProject>[] = [
    {
      fields: [],
      property: '_id',
      sortAsc: true,
      sticky: true,
      component: ProjectLinkProjectsComponent,
      label: 'ID Projet'
    },
    {
      fields: [PROJECT_FIELDS.PROJECT_NAME],
      property: 'projectName',
      label: 'Libellé'
    },
    {
      fields: [PROJECT_FIELDS.STATUS],
      property: 'status',
      label: 'Statut',
      format: (project: IEnrichedProject) =>
        this.taxonomyPipe.transform(project.status, TaxonomyGroup.projectStatus) as string
    },
    {
      fields: [PROJECT_FIELDS.STREET_NAME],
      property: 'streetName',
      label: 'Voie'
    },
    {
      fields: [PROJECT_FIELDS.STREET_FROM],
      property: 'streetFrom',
      label: 'Voie de'
    },
    {
      fields: [PROJECT_FIELDS.STREET_TO],
      property: 'streetTo',
      label: 'Voie à'
    },
    {
      fields: [PROJECT_FIELDS.START_YEAR],
      property: 'startYear',
      label: 'Année début',
      format: (project: IEnrichedProject) => project?.startYear?.toString() || ''
    },
    {
      fields: [PROJECT_FIELDS.END_YEAR],
      property: 'endYear',
      label: 'Année fin',
      format: (project: IEnrichedProject) => project?.endYear?.toString() || ''
    },
    {
      fields: [PROJECT_FIELDS.DECESIONS],
      property: 'decisions.status.audit.createdAt',
      permission: Permission.PROJECT_DECISION_READ,
      label: 'Date statut',
      format: (project: IEnrichedProject) => {
        try {
          const decisionsRelated = project.decisions.filter(des => des.typeId === project.status);
          const res = decisionsRelated.sort(
            (a, b) => new Date(a.audit.createdAt).getTime() - new Date(b.audit.createdAt).getTime()
          );
          return (this.datePipe.transform(res[0].audit.createdAt, 'yyyy-MM-dd HH:mm') as string) || '';
        } catch (error) {
          return '';
        }
      }
    },
    {
      fields: [PROJECT_FIELDS.GEOMETRYPIN],
      property: 'geometryPin',
      label: 'Nature projet',
      format: (project: IEnrichedProject) => {
        try {
          return project.geometryPin ? 'Géolocalisé' : 'Non-géolocalisé';
        } catch (e) {
          return 'Non-géolocalisé';
        }
      }
    },
    {
      fields: [PROJECT_FIELDS.PROJECT_TYPE_ID],
      property: 'projectTypeId',
      label: 'Type projet',
      format: (project: IEnrichedProject) =>
        (this.taxonomyPipe.transform(project.projectTypeId, TaxonomyGroup.projectType) as string) || ''
    },
    {
      fields: [PROJECT_FIELDS.ANNUAL_DISTRIBUTION],
      property: 'annualDistribution',
      label: 'Catégorie',
      format: (project: IEnrichedProject) => {
        try {
          return project.annualDistribution.annualPeriods
            .map(e => `${e.year} | ${this.taxonomyPipe.transform(e.categoryId, TaxonomyGroup.projectCategory)}`)
            .join(' ; ');
        } catch (e) {
          return '';
        }
      }
    },
    {
      fields: [PROJECT_FIELDS.SUB_CATEGORY_IDS],
      property: 'subCategoryIds',
      label: 'Sous-catégorie',
      format: (project: IEnrichedProject) =>
        (this.taxonomyPipe.transform(project.subCategoryIds, TaxonomyGroup.projectSubCategory) as string) || ''
    },
    {
      fields: [PROJECT_FIELDS.GLOBAL_BUDGET_ALLOWANCE],
      property: 'globalBudget.allowance',
      label: 'Budget (k$)',
      permission: Permission.PROJECT_BUDGET_READ,
      format: (project: IEnrichedProject) =>
        (project.globalBudget?.allowance?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') as string) || '0'
    },
    {
      fields: [PROJECT_FIELDS.LENGTH_VALUE],
      property: 'length.value',
      label: 'Longueur (km)',
      format: (project: IEnrichedProject) => {
        try {
          const value = project.length?.value || 0;
          const roundedValue = Math.round(value) / 1000;
          return roundedValue.toString() || '0';
        } catch (e) {
          return '0';
        }
      }
    },
    {
      fields: [PROJECT_FIELDS.IN_CHARGE_ID],
      property: 'inChargeId',
      label: 'Requérant initial',
      format: (project: IEnrichedProject) =>
        (this.taxonomyPipe.transform(project.inChargeId, TaxonomyGroup.requestor) as string) || ''
    },
    {
      fields: [PROJECT_FIELDS.EXECUTOR_ID],
      property: 'executorId',
      label: 'Exécutant',
      format: (project: IEnrichedProject) =>
        (this.taxonomyPipe.transform(project.executorId, TaxonomyGroup.executor) as string) || ''
    },
    {
      fields: [PROJECT_FIELDS.MEDAL_ID],
      property: 'medalId',
      label: 'Médaille',
      format: (project: IEnrichedProject) =>
        (this.taxonomyPipe.transform(project.medalId, TaxonomyGroup.medalType) as string) || ''
    },
    {
      fields: [PROJECT_FIELDS.BOROUGH_ID],
      property: 'boroughId',
      label: 'Arrondissement',
      format: (project: IEnrichedProject) =>
        (this.taxonomyPipe.transform(project.boroughId, TaxonomyGroup.borough) as string) || ''
    },
    {
      fields: [PROJECT_FIELDS.INTERVENTION_IDS],
      property: 'interventionIds',
      label: "Nombre d'interventions",
      permission: Permission.PROJECT_INTERVENTIONS_READ,
      format: (project: IEnrichedProject) => {
        try {
          return project.interventionIds.length.toString() as string;
        } catch (e) {
          return '0';
        }
      }
    },
    {
      fields: [PROJECT_FIELDS.ANNULAL_DISTRIBUTION],
      property: 'annualDistribution.annualPeriods.programBookId',
      label: 'Année|Carnet',
      component: ProjectYearProgrambookComponent,
      augmented: (project: IEnrichedProject) => {
        try {
          return project.annualDistribution.annualPeriods.map(e => ({
            year: e.year,
            programBook: this.programBooks.find(el => el.id === e.programBookId)
          }));
        } catch (e) {
          return '';
        }
      }
    },
    {
      fields: [PROJECT_FIELDS.SUBMISSION_NUMBER],
      property: 'submissionNumber',
      label: 'Numéro de soumission',
      component: ProjectSubmissionNumberComponent
    },
    {
      fields: [PROJECT_FIELDS.RISK_ID],
      property: 'riskId',
      label: 'Type de Risque',
      format: (project: IEnrichedProject) =>
        (this.taxonomyPipe.transform(project.riskId, TaxonomyGroup.riskType) as string) || ''
    },
    {
      fields: [PROJECT_FIELDS.ROAD_NETWORK_TYPE_ID],
      property: 'roadNetworkTypeId',
      label: 'Type réseau',
      format: (project: IEnrichedProject) =>
        (this.taxonomyPipe.transform(project.roadNetworkTypeId, TaxonomyGroup.roadNetworkType) as string) || ''
    },
    {
      fields: [PROJECT_FIELDS.SERVICE_PRIORITIES],
      property: 'servicePriorities',
      label: 'Priorité de service',
      format: (project: IEnrichedProject) => {
        try {
          const res = [];
          project.servicePriorities.forEach(p => {
            const el = `${this.taxonomyPipe.transform(
              p.priorityId,
              TaxonomyGroup.priorityType
            )} ${this.taxonomyPipe.transform(p.service, TaxonomyGroup.service)}`;
            res.push(el);
          });
          return res.length > 0 ? res.join(' ; ') : '';
        } catch (e) {
          return '';
        }
      }
    },
    {
      fields: [PROJECT_FIELDS.SUBMISSION_NUMBER],
      property: 'submissionNumberConception',
      label: 'Exigences de conception',
      component: ProjectConceptionRequirementComponent,
      augmented: (project: IEnrichedProject) => {
        try {
          const projectRequirementConceptions = [];
          if (this.shouldGetConceptionRequirements) {
            this.submissions.forEach(submission => {
              submission?.requirements?.forEach(r => {
                if (
                  r.projectIds?.includes(project.id) &&
                  projectRequirementConceptions.findIndex(req => req.id === r.id) < 0
                ) {
                  projectRequirementConceptions.push(r);
                }
              });
            });
          }

          const projectRequirementPlanifications = [];
          if (this.shouldGetPlanificationRequirements) {
            this.requirementPlanifications.forEach(requirement => {
              requirement.items?.forEach(r => {
                if (r.id === project.id) {
                  projectRequirementPlanifications.push(requirement);
                }
              });
            });
          }
          return {
            requirementConceptions: projectRequirementConceptions,
            requirementPlanifications: projectRequirementPlanifications,
            display: projectRequirementPlanifications?.length || projectRequirementConceptions.length
          };
        } catch (e) {
          return undefined;
        }
      }
    },
    {
      fields: ['requirementPlanification'],
      property: 'requirementPlanification',
      label: 'Exigences de planification'
    }
  ];

  public programBooks = [];
  public submissions: ISubmission[] = [];
  public requirementPlanifications: IRequirement[] = [];
  public shouldGetConceptionRequirements: boolean = false;
  public shouldGetPlanificationRequirements: boolean = false;

  constructor(
    private projectService: ProjectService,
    private requirementService: RequirementService,
    private submissionProjectService: SubmissionProjectService,
    private programBookService: ProgramBookService,
    private taxonomyPipe: TaxonomyPipe,
    private datePipe: DatePipe
  ) {
    super();
    this.displayedColumnsSubject.next(DEFAULT_DISPLAYED_COLUMNS);
    this.sortedColumnSubject.next(this.columns.find(el => el.sortAsc));
    this.datasourceDependencies$.subscribe(() => {
      this.load();
    });
  }
  public requestData(): Observable<IPaginatedResults<IEnrichedProject>> {
    return this.projectService.searchProjects(this.searchRequest);
  }

  public async augmentedResult(items: IEnrichedProject[]): Promise<IEnrichedProject[]> {
    // Exigences de conception
    if (this.shouldGetConceptionRequirements) {
      const ids = [];
      items.forEach(project => {
        if (
          project?.submissionNumber &&
          this.submissions.findIndex(el => el.submissionNumber === project?.submissionNumber) < 0 &&
          !ids.includes(project?.submissionNumber)
        ) {
          ids.push(project?.submissionNumber);
        }
      });
      if (ids.length > 0) {
        const resSubmissions = await this.submissionProjectService
          .submissionPostSearch({
            submissionNumber: ids,
            status: ['valid'],
            limit: ids.length,
            offset: 0,
            fields: ['submissionNumber', 'requirements']
          })
          .toPromise();
        this.submissions = [...this.submissions, ...resSubmissions.items];
      }
    }

    // Exigences de planification
    if (this.shouldGetPlanificationRequirements) {
      const projectIds = items.map(el => el.id);
      if (projectIds.length > 0) {
        const resultRequirementPlanifications = await this.requirementService
          .getRequirements({
            itemId: projectIds,
            itemType: 'project',
            limit: 100000
          })
          .toPromise();
        this.requirementPlanifications = resultRequirementPlanifications.items;
      }
    }

    // Année|Carnet
    if (this.searchRequest.fields.includes('annualDistribution')) {
      const ids = [];
      items.forEach(project => {
        if (project?.annualDistribution?.annualPeriods.length > 0) {
          project.annualDistribution.annualPeriods.forEach(annualPeriod => {
            if (
              annualPeriod.programBookId &&
              this.programBooks.findIndex(el => el.id === annualPeriod.programBookId) < 0 &&
              !ids.includes(annualPeriod.programBookId)
            ) {
              ids.push(annualPeriod.programBookId);
            }
          });
        }
      });
      if (ids.length > 0) {
        const resProgramBooks = await this.programBookService.getProgramBooks(ids, ['id', 'name']);
        this.programBooks = [...this.programBooks, ...resProgramBooks.items];
      }
    }
    return items;
  }
}
