import { Component, OnInit } from '@angular/core';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IRequirement,
  IRequirementSearchRequest,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { flatten, map, orderBy } from 'lodash';
import { take } from 'rxjs/operators';
import { TDirection } from 'src/app/program-book/shared/models/submission-drm-columns';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { IAppSort, SortingStatus } from 'src/app/shared/directives/sort.directive';
import { SortDirection } from 'src/app/shared/forms/sort/sort-utils';
import { INTERVENTION_FIELDS } from 'src/app/shared/models/findOptions/interventionFields';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { ProjectsColumns, ProjectsToScheduleColumnLabels } from 'src/app/shared/models/table/column-config-enums';
import { IColumn } from 'src/app/shared/models/table/column-config-interfaces';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { RequirementService } from 'src/app/shared/services/requirement.service';
import { WindowSubmissionStoreService } from 'src/app/shared/services/window-submission-store.service';
export interface ISubmissionProjectLine {
  project: IEnrichedProject;
  requirementsSubmissionLine?: IRequirementSubmissionLine[];
}
interface IRequirementSubmissionLine {
  requirement: IRequirement;
  itemObject?: IRequirementItemObject;
}

interface IRequirementItemObject {
  link: string;
  id: string;
  streetName: string;
}
@Component({
  selector: 'app-submission-projects',
  templateUrl: './submission-projects.component.html',
  styleUrls: ['./submission-projects.component.scss']
})
export class SubmissionProjectsComponent extends BaseComponent implements OnInit {
  public sortedDirection = SortDirection.asc as TDirection;

  public isInitializingTable: boolean = false;
  public projects: IEnrichedProject[];
  public requirementProjectsItems: IEnrichedProject[];
  public requirementInterventionsItems: IEnrichedIntervention[];
  public requirements: IRequirement[] = [];

  public submissionProjects: ISubmissionProjectLine[] = [];

  public columns: IColumn[] = [
    {
      columnName: ProjectsColumns.REQUIREMENT_COUNT,
      className: `col-${ProjectsColumns.REQUIREMENT_COUNT}`,
      displayOrder: 1,
      sorting: SortingStatus.inactive
    },
    {
      columnName: ProjectsColumns.ID,
      className: `col-${ProjectsColumns.ID}`,
      displayOrder: 2,
      sorting: SortingStatus.inactive
    },
    {
      columnName: ProjectsColumns.PROJECT_NAME,
      className: `col-${ProjectsColumns.PROJECT_NAME}`,
      displayOrder: 3,
      sorting: SortingStatus.inactive
    },

    {
      columnName: ProjectsColumns.PROGRAM,
      className: `col-${ProjectsColumns.PROGRAM}`,
      displayOrder: 4,
      sorting: SortingStatus.inactive
    },

    {
      columnName: ProjectsColumns.STREET_NAME,
      className: `col-${ProjectsColumns.STREET_NAME}`,
      displayOrder: 5,
      sorting: SortingStatus.inactive
    },
    {
      columnName: ProjectsColumns.STREET_FROM,
      className: `col-${ProjectsColumns.STREET_FROM}`,
      displayOrder: 6,
      sorting: SortingStatus.inactive
    },
    {
      columnName: ProjectsColumns.STREET_TO,
      className: `col-${ProjectsColumns.STREET_TO}`,
      displayOrder: 7,
      sorting: SortingStatus.inactive
    },
    {
      columnName: ProjectsColumns.BOROUGH_ID,
      className: `col-${ProjectsColumns.BOROUGH_ID}`,
      displayOrder: 8,
      sorting: SortingStatus.inactive
    }
  ];

  public ProjectsToScheduleColumnLabels = ProjectsToScheduleColumnLabels;

  constructor(
    private readonly projectService: ProjectService,
    private readonly windowSubmissionStoreService: WindowSubmissionStoreService,
    private readonly requirementService: RequirementService,
    private readonly interventionsService: InterventionService
  ) {
    super();
  }

  public ngOnInit() {
    this.isInitializingTable = true;
    this.windowSubmissionStoreService.projects$.subscribe(async projects => {
      this.projects = projects;
      await this.getPniPrograms();
      this.getRequirements();
      this.isInitializingTable = false;
    });
  }
  public getRequirements(): void {
    const searchObject: IRequirementSearchRequest = {
      limit: 100000,
      itemId: this.windowSubmissionStoreService.submission.projectIds,
      itemType: ObjectType.project
    };
    this.requirementService
      .getRequirements(searchObject)
      .pipe(take(1))
      .subscribe(async data => {
        this.requirements = data.items;
        const requirementItems = flatten(map(this.requirements, 'items'));
        const itemsProjectIds = flatten(requirementItems)
          .filter(item => item.type === ObjectType.project)
          .map(el => el.id);
        const interventionIds = flatten(requirementItems)
          .filter(item => item.type === ObjectType.intervention)
          .map(el => el.id);

        if (interventionIds.length) {
          this.requirementInterventionsItems = await this.interventionsService
            .searchInterventionsPost({
              id: interventionIds,
              fields: ['interventionName']
            })
            .toPromise();
        }
        if (itemsProjectIds.length) {
          const projects = await this.projectService
            .searchProjects({
              id: itemsProjectIds,
              fields: ['streetName']
            })
            .toPromise();
          this.requirementProjectsItems = projects.items;
        }
        this.initSubmissionProjects();
      });
  }

  public initSubmissionProjects(): void {
    this.submissionProjects = this.projects.map(p => {
      const requirements = this.requirements.filter(r => r.items.some(item => item.id === p.id));

      return {
        project: p,
        requirementsSubmissionLine: requirements.map(req => {
          const reqItem = req.items.find(el => el.id !== p.id);
          let itemObjectToAdd: IRequirementItemObject;
          if (reqItem?.type === ObjectType.project) {
            const itemObject = this.requirementProjectsItems.find(el => el.id === reqItem.id);
            itemObjectToAdd = {
              id: reqItem.id,
              link: itemObject ? this.projectService.getProjectLink(itemObject) : '',
              streetName: itemObject?.streetName
            };
          } else if (reqItem?.type === ObjectType.intervention) {
            const itemObject = this.requirementInterventionsItems.find(el => el.id === reqItem.id);
            itemObjectToAdd = {
              id: reqItem.id,
              link: itemObject ? this.interventionsService.getInterventionLink(itemObject) : '',
              streetName: itemObject?.interventionName
            };
          }
          return {
            requirement: req,
            itemObject: itemObjectToAdd
          };
        })
      };
    });
  }

  public async getPniPrograms(): Promise<void> {
    const pniInterventionIds = flatten(
      this.projects.filter(el => el.projectTypeId === ProjectType.nonIntegrated).map(el => el.interventionIds)
    );
    if (pniInterventionIds.length > 0) {
      const searchObject = {
        id: pniInterventionIds,
        fields: [INTERVENTION_FIELDS.PROGRAM_ID],
        limit: pniInterventionIds.length
      };
      const interventions = await this.interventionsService.searchInterventionsPost(searchObject).toPromise();
      this.projects = this.projects.map(p => {
        const projectInterventions = interventions.filter(i => i.id === p.interventionIds[0]);
        return { ...p, interventions: projectInterventions };
      });
    }
  }
  public async handleSortChange(event: IAppSort, sortedColum: IColumn): Promise<void> {
    this.sortedDirection = event.direction as TDirection;
    this.columns.map(el => {
      el.sorting = el.columnName === sortedColum.columnName ? SortingStatus.active : SortingStatus.inactive;
      return el;
    });

    this.projects = orderBy(this.projects, sortedColum.columnName, this.sortedDirection);
    this.initSubmissionProjects();
  }
}
