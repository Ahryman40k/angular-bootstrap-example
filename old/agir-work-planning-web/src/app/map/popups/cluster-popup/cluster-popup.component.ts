import { Component } from '@angular/core';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IPaginatedRtuProjects,
  IRtuProject,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Dictionary, groupBy } from 'lodash';
import { take } from 'rxjs/operators';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { IRtuProjectCriteria } from 'src/app/shared/models/rtu-project-criteria';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { LocationService } from 'src/app/shared/services/location.service';
import { ObjectTypeService } from 'src/app/shared/services/object-type.service';
import { ProjectService } from 'src/app/shared/services/project.service';

import { AssetService } from '../../../shared/services/asset.service';
import { RtuProjectService } from '../../../shared/services/rtu-project.service';
import { BasePopupComponent } from '../base-popup.component';

@Component({
  selector: 'app-cluster-popup',
  templateUrl: './cluster-popup.component.html',
  styleUrls: ['./cluster-popup.component.scss']
})
export class ClusterPopupComponent extends BasePopupComponent {
  public readonly ObjectType = ObjectType;

  public objects: (IEnrichedProject | IEnrichedIntervention | IRtuProject)[] = [];
  public currentIndex = 0;
  public features: (IEnrichedIntervention | IEnrichedProject | IRtuProject)[] = [];

  public get headerClass(): any {
    const c = {};
    if (!this.objects[this.currentIndex]) {
      return c;
    }
    const object = this.objects[this.currentIndex];
    if (object) {
      const objectType = this.objectTypeService.getObjectTypeFromModel(object);
      switch (objectType) {
        case ObjectType.intervention:
          c[`bg-app-${this.interventionService.getInterventionColor(object as IEnrichedIntervention)}`] = true;
          break;
        case ObjectType.project:
          c[`bg-app-${this.projectService.getProjectColor(object as IEnrichedProject)}`] = true;
          break;
        case ObjectType.asset:
          c[`bg-app-asset`] = true;
          break;
        case ObjectType.address:
          c[`bg-app-address`] = true;
          break;
        default:
          break;
      }
    }
    return c;
  }

  constructor(
    private readonly interventionService: InterventionService,
    private readonly projectService: ProjectService,
    private readonly rtuProjectService: RtuProjectService,
    private readonly assetService: AssetService,
    private readonly locationService: LocationService,
    public objectTypeService: ObjectTypeService
  ) {
    super();
  }

  public async init(featureModels: any[]): Promise<void> {
    this.features = featureModels;
    const groupedObjectTypes: ObjectType[] = [ObjectType.project, ObjectType.intervention, ObjectType.rtuProject];
    const mapIds = (objects: any[]) => objects.map(el => el.id);
    const groupedFeatures: Dictionary<any[]> = groupBy(featureModels, f =>
      this.objectTypeService.getObjectTypeFromModel(f)
    );
    Object.keys(groupedFeatures)
      .filter((objectType: ObjectType) => groupedObjectTypes.includes(objectType))
      .map(async (objectType: ObjectType) => {
        const objects = groupedFeatures[objectType];
        switch (objectType) {
          case ObjectType.project:
            const nonIntegratedProjects: IEnrichedProject[] = objects.filter(
              (f: IEnrichedProject) => f.projectTypeId === ProjectType.nonIntegrated
            );
            const otherProjects: IEnrichedProject[] = objects.filter(
              (f: IEnrichedProject) => f.projectTypeId !== ProjectType.nonIntegrated
            );
            if (nonIntegratedProjects.length) {
              this.objects.push(...(await this.projectService.getFullProjectsByIds(mapIds(nonIntegratedProjects))));
            }
            if (otherProjects.length) {
              this.objects.push(
                ...(await this.projectService.getProjectsWithOutInterventionByIds(mapIds(otherProjects)))
              );
            }
            break;
          case ObjectType.intervention:
            this.objects.push(...(await this.interventionService.getInterventionByIds(mapIds(objects))));
            break;
          // default object type ObjectType.rtuProject
          default:
            const rtuProjectsParams: IRtuProjectCriteria = {
              id: mapIds(objects).join(',')
            };
            this.rtuProjectService
              .getRtuProjects(rtuProjectsParams)
              .pipe(take(1))
              .subscribe((rtuProjects: IPaginatedRtuProjects) => {
                this.objects.push(...rtuProjects.items);
              });
            break;
        }
      });
    await Promise.all(
      featureModels
        .filter(f => !groupedObjectTypes.includes(this.objectTypeService.getObjectTypeFromModel(f)))
        .map(async f => {
          const objectType = this.objectTypeService.getObjectTypeFromModel(f);
          if (objectType === ObjectType.asset) {
            this.objects.push(await this.assetService.get(f.typeId, f.id));
          } else if (
            objectType === ObjectType.address &&
            this.objectTypeService.getObjectTypeFromFeature(f) === ObjectType.address
          ) {
            this.objects.push(await this.locationService.getAddress(f.properties.id).toPromise());
          }
        })
    );
    this.initializedSubject.next();
  }

  public previous(): void {
    if (this.currentIndex === 0) {
      return;
    }
    --this.currentIndex;
    return;
  }

  public next(): void {
    if (this.currentIndex === this.objects.length - 1) {
      return;
    }
    ++this.currentIndex;
    return;
  }
}
