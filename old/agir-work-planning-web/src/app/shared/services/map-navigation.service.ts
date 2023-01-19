import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IAsset } from '@villemontreal/agir-work-planning-lib/dist/src';

import { ObjectType } from '../models/object-type/object-type';
import { SearchObjectsService } from './search-objects.service';

export enum MapOutlet {
  leftPanel = 'leftPanel',
  rightPanel = 'rightPanel'
}
@Injectable()
export class MapNavigationService {
  public route: ActivatedRoute;

  constructor(private readonly router: Router, private readonly searchObjectsService: SearchObjectsService) {}

  public navigateTo(outlet: MapOutlet, commands: any[]): Promise<boolean> {
    const outlets = {};
    outlets[outlet] = commands;
    return this.router.navigate([{ outlets }], {
      relativeTo: this.route
    });
  }

  public navigateToSelection(value: any): Promise<boolean> {
    let commands: any[];
    switch (this.searchObjectsService.getResultType(value)) {
      case ObjectType.address:
        commands = ['addresses', value.id];
        break;
      case ObjectType.asset:
        const asset = value as IAsset;
        commands = ['assets', asset.typeId, asset.id];
        break;
      case ObjectType.intervention:
        commands = ['interventions', value.id];
        break;
      case ObjectType.project:
        commands = ['projects', value.id, value.projectTypeId];
        break;
      case ObjectType.rtuProject:
        commands = ['rtuProjects', value.id];
        break;
      default:
        break;
    }
    return this.navigateTo(MapOutlet.rightPanel, ['selection', ...commands]);
  }
}
