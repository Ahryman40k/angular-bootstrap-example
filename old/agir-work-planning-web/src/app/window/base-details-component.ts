import { ActivatedRoute } from '@angular/router';
import { IEnrichedIntervention, IEnrichedProject, IRtuProject } from '@villemontreal/agir-work-planning-lib/dist/src';

import { BaseComponent } from '../shared/components/base/base.component';
import { WindowService } from '../shared/services/window.service';
import { IRestrictionItem } from '../shared/user/user-restrictions.service';

export abstract class BaseDetailsComponent extends BaseComponent {
  public get project(): IEnrichedProject {
    return this.windowService.currentProject;
  }

  public get intervention(): IEnrichedIntervention {
    return this.windowService.currentIntervention;
  }

  public get rtuProject(): IRtuProject {
    return this.windowService.currentRtuProject;
  }

  public get canInteract(): boolean {
    return this.windowService.canInteract;
  }

  constructor(protected windowService: WindowService, protected activatedRoute: ActivatedRoute) {
    super();
  }

  public get projectRestrictionItems(): IRestrictionItem[] {
    return [{ entity: this.project, entityType: 'PROJECT' }];
  }

  public get interventionRestrictionItems(): IRestrictionItem[] {
    return [{ entity: this.intervention, entityType: 'INTERVENTION' }];
  }
}
