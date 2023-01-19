import { OnInit } from '@angular/core';
import {
  IEnrichedProject,
  IRtuProject,
  ITaxonomy,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { take } from 'rxjs/operators';

import { ILabelProject } from '../../../map/panel/bottom-panel/bottom-panel.component';
import { ObjectType } from '../../models/object-type/object-type';
import { ObjectTypeService } from '../../services/object-type.service';
import { TaxonomiesService } from '../../services/taxonomies.service';

export enum LabelProjectType {
  integrated = 'integrated',
  nonIntegrated = 'nonIntegrated',
  rtuProject = 'rtuProject'
}

export class BaseRoadSectionActivityComponent implements OnInit {
  public labelProject: ILabelProject<IEnrichedProject | IRtuProject>;
  public LabelProjectType = LabelProjectType;
  public rtuStatus: ITaxonomy[];

  constructor(
    private readonly objectTypeService: ObjectTypeService,
    private readonly taxonomiesService: TaxonomiesService
  ) {}

  public get labelProjectType(): LabelProjectType {
    if (!this.labelProject) {
      return null;
    }
    const objectType = this.objectTypeService.getObjectTypeFromModel(this.labelProject.project);
    if (objectType === ObjectType.project) {
      const project = this.labelProject.project as IEnrichedProject;
      if (project.projectTypeId === ProjectType.nonIntegrated) {
        return LabelProjectType.nonIntegrated;
      }
      return LabelProjectType.integrated;
    }
    if (objectType === ObjectType.rtuProject) {
      return LabelProjectType.rtuProject;
    }
  }

  public get startYear(): number {
    return (
      (this.labelProject.project as IEnrichedProject).startYear ||
      new Date((this.labelProject.project as IRtuProject).dateStart).getFullYear()
    );
  }

  public get endYear(): number {
    return (
      (this.labelProject.project as IEnrichedProject).endYear ||
      new Date((this.labelProject.project as IRtuProject).dateEnd).getFullYear()
    );
  }

  public get project(): IEnrichedProject {
    return this.labelProject.project as IEnrichedProject;
  }

  public get rtuProject(): IRtuProject {
    return this.labelProject.project as IRtuProject;
  }

  public ngOnInit(): void {
    this.taxonomiesService
      .group(TaxonomyGroup.rtuProjectStatus)
      .pipe(take(1))
      .subscribe(t => (this.rtuStatus = t));
  }
}
