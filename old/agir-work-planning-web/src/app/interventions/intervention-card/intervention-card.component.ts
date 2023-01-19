import { Component, Input, OnChanges, OnInit, Optional } from '@angular/core';
import { IEnrichedIntervention, InterventionStatus } from '@villemontreal/agir-work-planning-lib';
import { IMoreOptionsMenuItem } from 'src/app/shared/models/more-options-menu/more-options-menu-item';
import { InterventionMenuService } from 'src/app/shared/services/intervention-menu.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapNavigationService } from 'src/app/shared/services/map-navigation.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { IRestrictionItem, RestrictionType } from 'src/app/shared/user/user-restrictions.service';

import { BaseObjectCardComponent } from '../../shared/components/card/base-object-card.component';

@Component({
  selector: 'app-intervention-card',
  templateUrl: 'intervention-card.component.html',
  styleUrls: ['./intervention-card.component.scss']
})
export class InterventionCardComponent extends BaseObjectCardComponent implements OnInit, OnChanges {
  public InterventionStatus = InterventionStatus;
  public RestrictionType = RestrictionType;

  @Input() public intervention: IEnrichedIntervention;
  public programLabel: string;
  public interventionMenuItems: IMoreOptionsMenuItem[];
  constructor(
    private readonly interventionMenuService: InterventionMenuService,
    public interventionService: InterventionService,
    private readonly taxonomiesService: TaxonomiesService,
    @Optional() mapNavigationService: MapNavigationService
  ) {
    super(mapNavigationService);
  }
  public ngOnChanges(): void {
    this.programLabel = '';
    if (this.intervention.programId) {
      this.taxonomiesService
        .code(this.TaxonomyGroup.programType, this.intervention.programId)
        .subscribe(programLabelTaxonomy => {
          this.programLabel = programLabelTaxonomy?.properties?.acronym?.fr || programLabelTaxonomy?.label?.fr;
        });
    }
    if (this.intervention) {
      this.setInterventionMenuItems();
    }
  }
  public setInterventionMenuItems(): void {
    this.interventionMenuItems = this.interventionMenuService.getMenuItems(this.intervention, { newWindow: true });
  }
  protected onClick(): void {
    this.navigateToSelection(this.intervention);
  }

  public get restrictionItems(): IRestrictionItem[] {
    return [{ entity: this.intervention, entityType: 'INTERVENTION' }];
  }
}
