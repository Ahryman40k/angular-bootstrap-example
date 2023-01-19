import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IEnrichedIntervention,
  InterventionStatus,
  IRequirement,
  Permission
} from '@villemontreal/agir-work-planning-lib';
import { RequirementListComponent } from 'src/app/shared/components/requirements/requirement-list/requirement-list.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { SortingStatus } from 'src/app/shared/directives/sort.directive';
import { ConfirmationModalCloseType } from 'src/app/shared/forms/confirmation-modal/confirmation-modal.component';
import { InterventionRequirementCreateModalComponent } from 'src/app/shared/forms/intervention-requirement-create-modal/intervention-requirement-create-modal.component';
import { DecisionCreationCloseType } from 'src/app/shared/forms/project-requirement-create-modal/project-requirement-create-modal.component';
import { SortDirection } from 'src/app/shared/forms/sort/sort-utils';
import { RequirementService } from 'src/app/shared/services/requirement.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { IRestrictionItem } from 'src/app/shared/user/user-restrictions.service';
import { UserService } from 'src/app/shared/user/user.service';

import { UserRestrictionsService } from '../../shared/user/user-restrictions.service';
import { BaseDetailsComponent } from '../base-details-component';

export interface IAssociatedRequirement {
  requirement: IRequirement;
  interventionId: string;
}

enum InterventionMessages {
  noResult = "Il n'y a pas d'exigences dans cette intervention pour l'instant.",
  delete = 'La suppression de cette exigence entrainera la perte des données.\nÊtes-vous certain de vouloir continuer?'
}

@Component({
  selector: 'app-intervention-requirement',
  templateUrl: './intervention-requirement.component.html',
  styleUrls: ['./intervention-requirement.component.scss']
})
export class InterventionRequirementComponent extends BaseDetailsComponent implements OnInit {
  @ViewChild(RequirementListComponent) public requirementListChild: RequirementListComponent;

  public get intervention(): IEnrichedIntervention {
    return this.windowService.currentIntervention;
  }

  public get canWriteRequirement(): boolean {
    if (!this.userService.currentUser) {
      return false;
    }
    return (
      this.canInteract &&
      this.userService.currentUser.hasPermission(Permission.REQUIREMENT_WRITE) &&
      this.userRestrictionsService.validate(this.interventionRestrictionItems)
    );
  }
  get disabledAddButton(): boolean {
    return (
      this.intervention?.status !== InterventionStatus.accepted &&
      this.intervention?.status !== InterventionStatus.integrated
    );
  }

  public sortingActive: SortingStatus = SortingStatus.active;
  public sortedRequirements: IAssociatedRequirement[] = [];
  public sortingDirection: SortDirection = SortDirection.desc;

  constructor(
    private readonly dialogsService: DialogsService,
    public windowService: WindowService,
    activatedRoute: ActivatedRoute,
    private readonly requirementService: RequirementService,
    private readonly userRestrictionsService: UserRestrictionsService,
    private readonly userService: UserService
  ) {
    super(windowService, activatedRoute);
  }

  public openCreationModal(): void {
    this.requirementService.setCreationFormStatus(false);
    void this.openModal();
  }

  public openEditModal(requirement: IRequirement): void {
    void this.openModal(requirement);
  }

  public async openModal(requirement?: IRequirement): Promise<void> {
    const modal = this.dialogsService.showModal(InterventionRequirementCreateModalComponent);

    const openModalVerb = requirement ? 'Modifier' : 'Ajouter';
    modal.componentInstance.title = `${openModalVerb} une exigence`;
    modal.componentInstance.requirement = requirement;
    modal.componentInstance.buttonLabel = openModalVerb;
    modal.componentInstance.intervention = this.intervention;

    const result = (await modal.result) as DecisionCreationCloseType;
    if (result === DecisionCreationCloseType.confirmed) {
      this.refresh();
    }
  }

  public refresh(): void {
    void this.windowService.refresh();
  }

  public async openDeleteModal(requirement: IRequirement): Promise<void> {
    const modal = this.dialogsService.showDeleteModal('Supprimer une exigence', InterventionMessages.delete);
    const result = await modal.result;
    if (result === ConfirmationModalCloseType.confirmed) {
      this.requirementService.deleteRequirement(requirement);
      this.refresh();
    }
  }
  public sort(direction: SortDirection): void {
    this.sortingDirection = direction;
    this.requirementListChild.requirementList.reverse();
  }
}
