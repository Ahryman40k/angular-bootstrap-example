import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import {
  IEnrichedProject,
  IRtuProject,
  ITaxonomyList,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';

import { ObjectType } from '../models/object-type/object-type';
import { ObjectTypeService } from '../services/object-type.service';
import { RtuProjectService } from '../services/rtu-project.service';
import { TaxonomiesService } from '../services/taxonomies.service';

const rtuProjectBadges = {
  borough: 'badge-info',
  city: 'badge-info-light',
  partner: 'badge-fuchsia'
};

enum ProjectBadge {
  integrated = 'badge-success',
  nonIntegrated = 'badge-success-light'
}
@Pipe({ name: 'appProjectTypeBadge', pure: false })
export class ProjectTypeBadgePipe implements PipeTransform, OnDestroy {
  // Cached value
  public value: string;

  // Unsub triggers
  private readonly transform$ = new Subject();
  private readonly destroy$ = new Subject();

  constructor(
    private readonly taxonomiesService: TaxonomiesService,
    private readonly objectTypeService: ObjectTypeService,
    private readonly _ref: ChangeDetectorRef,
    private readonly rtuProjectService: RtuProjectService
  ) {}

  public transform(project: IEnrichedProject | IRtuProject): string {
    if (!project) {
      return null;
    }
    this.transform$.next();

    this.taxonomiesService
      .group(TaxonomyGroup.infoRtuPartner)
      .pipe(take(1))
      .subscribe(x => this.updateBadge(project, x));

    return this.value;
  }

  private updateBadge(project: IEnrichedProject | IRtuProject, taxonomies: ITaxonomyList): void {
    const rtuPartnerByCategory = this.rtuProjectService.getPartnerIdsByCategory(taxonomies);
    const objectType = this.objectTypeService.getObjectTypeFromModel(project);
    if (objectType === ObjectType.project) {
      const p = project as IEnrichedProject;
      if (p.projectTypeId === ProjectType.nonIntegrated) {
        this.value = ProjectBadge.nonIntegrated;
        return;
      }
      this.value = ProjectBadge.integrated;
      return;
    }
    if (objectType === ObjectType.rtuProject) {
      const p = project as IRtuProject;
      for (const key of Object.keys(rtuProjectBadges)) {
        if (rtuPartnerByCategory[key].includes(p.partnerId)) {
          this.value = rtuProjectBadges[key];
          break;
        }
      }
    }

    this._ref.markForCheck();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
  }
}
