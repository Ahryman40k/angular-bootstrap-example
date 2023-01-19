import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IRequirement,
  IRequirementItem,
  IRequirementSearchRequest,
  Permission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { startWith, takeUntil } from 'rxjs/operators';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { RequirementService } from 'src/app/shared/services/requirement.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { UserService } from 'src/app/shared/user/user.service';
import { BaseDetailsComponent } from 'src/app/window/base-details-component';
import { IRestrictionItem, UserRestrictionsService } from '../../../user/user-restrictions.service';

export enum BtnLabel {
  selected = 'Sélectionner',
  remove = 'Retirer'
}
enum FormMessages {
  noResultForProject = "Il n'y a pas d'exigences dans ce projet pour l'instant.",
  noResultForIntervention = "Il n'y a pas d'exigences dans cette intervention pour l'instant.",
  delete = 'La suppression de cette exigence entrainera la perte des données.\nÊtes-vous certain de vouloir continuer?'
}
@Component({
  selector: 'app-requirement-list',
  templateUrl: './requirement-list.component.html'
})
export class RequirementListComponent extends BaseDetailsComponent implements OnInit {
  public ObjectType = ObjectType;
  @Input() public restrictionItems: IRestrictionItem[] = [];
  @Input() public objectType: ObjectType.intervention | ObjectType.project;
  @Input() public object: IEnrichedProject | IEnrichedIntervention;

  @Output() public openModalEdit = new EventEmitter();
  @Output() public openModalDelete = new EventEmitter();

  public noResultMessage: string;
  public interventions: IEnrichedIntervention[] = [];
  public projects: IEnrichedProject[] = [];
  public requirementList: IRequirement[] = [];
  public FormMessages = FormMessages;
  public itemsWithOutCurrentObject: IRequirementItem[] = [];
  public limit: number = 100000;

  public get canInteract(): boolean {
    return this.windowService.canInteract;
  }
  public get canWriteRequirement(): boolean {
    if (!this.userService.currentUser) {
      return false;
    }
    return (
      this.canInteract &&
      this.userService.currentUser.hasPermission(Permission.REQUIREMENT_WRITE) &&
      this.userRestrictionsService.validate(this.restrictionItems)
    );
  }

  constructor(
    public windowService: WindowService,
    private readonly interventionsService: InterventionService,
    private readonly projectsService: ProjectService,
    private readonly requirementService: RequirementService,
    private readonly userService: UserService,
    private readonly userRestrictionsService: UserRestrictionsService,
    activatedRoute: ActivatedRoute
  ) {
    super(windowService, activatedRoute);
  }

  public ngOnInit(): void {
    if (this.objectType === ObjectType.intervention) {
      this.noResultMessage = FormMessages.noResultForIntervention;
    } else if (this.objectType === ObjectType.project) {
      this.noResultMessage = FormMessages.noResultForProject;
    }

    this.getRequirementList();
  }

  public getRequirementList(): void {
    this.requirementService.requirementChanged$.pipe(startWith(null), takeUntil(this.destroy$)).subscribe(async () => {
      await this.getRequirements();
    });
  }

  public async getRequirements(): Promise<IRequirement[]> {
    const searchObject: IRequirementSearchRequest = {
      limit: this.limit,
      itemId: this.object.id,
      itemType: this.objectType
    };
    const requirements = await this.requirementService.getRequirements(searchObject).toPromise();
    this.requirementList = requirements.items;
    const interventionsIds: string[] = [];
    const projectsIds: string[] = [];

    this.requirementList.forEach(requirement => {
      if (requirement.items.length > 1) {
        const items = requirement.items;
        const itemWithOutCurrentObject = this.getItemWithOutCurrentObject(items);
        if (
          itemWithOutCurrentObject &&
          itemWithOutCurrentObject.type === ObjectType.intervention &&
          !interventionsIds.includes(itemWithOutCurrentObject.id)
        ) {
          interventionsIds.push(itemWithOutCurrentObject.id);
        } else if (
          itemWithOutCurrentObject &&
          itemWithOutCurrentObject.type === ObjectType.project &&
          !projectsIds.includes(itemWithOutCurrentObject.id)
        ) {
          projectsIds.push(itemWithOutCurrentObject.id);
        }
      }
    });
    if (interventionsIds.length) {
      this.interventions = await this.interventionsService
        .searchInterventionsPost({
          id: interventionsIds,
          fields: ['interventionName']
        })
        .toPromise();
    }
    if (projectsIds.length) {
      const projects = await this.projectsService
        .searchProjects({
          id: projectsIds,
          fields: ['streetName']
        })
        .toPromise();
      this.projects = projects.items;
    }
    return this.requirementList;
  }

  public getItemWithOutCurrentObject(items: IRequirementItem[]): IRequirementItem {
    return items.find(e => e.id !== this.object.id);
  }

  public getItemIntervention(item: IRequirementItem): IEnrichedIntervention {
    return item ? this.interventions.find(e => e.id === item.id) : undefined;
  }
  public getItemProject(item: IRequirementItem): IEnrichedProject {
    return item ? this.projects.find(e => e.id === item.id) : undefined;
  }
  public getLinkedItemTitle(item: IRequirementItem): string {
    if (!item) {
      return undefined;
    }
    let requirementTitle: string = '';
    if (item.type === ObjectType.intervention && this.interventions.length) {
      requirementTitle = this.getItemIntervention(item)?.interventionName;
    } else if (item.type === ObjectType.project && this.projects.length) {
      requirementTitle = this.getItemProject(item)?.streetName;
    }
    return requirementTitle;
  }

  public getItemLink(item: IRequirementItem): string {
    if (!item) {
      return undefined;
    }
    let link: string = '';
    if (item.type === ObjectType.intervention && this.interventions.length) {
      const itemIntervention = this.getItemIntervention(item);
      if (itemIntervention) {
        link = this.interventionsService.getInterventionLink(itemIntervention);
      }
    } else if (item.type === ObjectType.project && this.projects.length) {
      const itemProject = this.getItemProject(item);
      if (itemProject) {
        link = this.projectsService.getProjectLink(itemProject);
      }
    }
    return link;
  }

  public openEditModal(requirement): void {
    this.openModalEdit.emit(requirement);
  }

  public openDeleteModal(requirement): void {
    this.openModalDelete.emit(requirement);
  }
}
