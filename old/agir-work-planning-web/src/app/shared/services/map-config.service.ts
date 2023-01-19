import { Injectable } from '@angular/core';
import { Permission, TaxonomyGroup, User } from '@villemontreal/agir-work-planning-lib/dist/src';
import { MtlAuthenticationService } from '@villemontreal/core-security-angular-lib';
import { IMapConfig } from '@villemontreal/maps-angular-lib';
import { ILayerConfig } from '@villemontreal/maps-angular-lib/lib/models/layer-config.model';
import { cloneDeep } from 'lodash';
import { RequestParameters } from 'mapbox-gl';
import { take } from 'rxjs/operators';
import { MapLogicLayer } from 'src/app/map/config/layers/logic-layers/map-logic-layer-enum';
import { environment } from 'src/environments/environment';

import { mapSourcesSecured } from '../../map/config/sources';
import { UserService } from '../user/user.service';
import { TaxonomiesService } from './taxonomies.service';

@Injectable({
  providedIn: 'root'
})
export class MapConfigService {
  constructor(
    private readonly userService: UserService,
    private readonly taxonomyService: TaxonomiesService,
    private readonly authenticationService: MtlAuthenticationService
  ) {}

  public async getMapConfig(): Promise<IMapConfig> {
    const config = cloneDeep(environment.map.config);

    await this.setLogicLayers(config);
    this.setRequestTransformation(config);

    return config;
  }

  private async setLogicLayers(config: IMapConfig): Promise<void> {
    const user = await this.userService.getCurrentUser();

    /**
     * First layer call by addLogicLayers() is the first layer draw on the map.
     */
    this.addLogicLayers(config.mapStyleDefinition, [
      MapLogicLayer.greyBasemap,
      MapLogicLayer.basemapLabels,
      MapLogicLayer.selectionRadius
    ]);

    await this.addAssetLogicLayers(config.mapStyleDefinition, user);

    this.addLogicLayers(config.mapStyleDefinition, [MapLogicLayer.boroughs, MapLogicLayer.countByBorough]);
    this.addLogicLayers(config.mapStyleDefinition, [MapLogicLayer.countByCity]);
    this.addLogicLayers(config.mapStyleDefinition, [MapLogicLayer.projectCreation]);
    this.addLogicLayers(
      config.mapStyleDefinition,
      [MapLogicLayer.interventionCreation],
      user,
      Permission.INTERVENTION_ZONE_READ
    );
    this.addLogicLayers(config.mapStyleDefinition, [
      MapLogicLayer.pastProjectAreas,
      MapLogicLayer.presentProjectAreas,
      MapLogicLayer.plannedProjectAreas,
      MapLogicLayer.replannedProjectAreas,
      MapLogicLayer.postponedProjectAreas,
      MapLogicLayer.futureProjectAreas,
      MapLogicLayer.multipleYearsProjectAreas,
      MapLogicLayer.multipleYearsPlannedProjectAreas,
      MapLogicLayer.multipleYearsReplannedProjectAreas,
      MapLogicLayer.multipleYearsPostponedProjectAreas
    ]);
    this.addLogicLayers(config.mapStyleDefinition, [
      MapLogicLayer.pastRtuProjectAreas,
      MapLogicLayer.presentRtuProjectAreas,
      MapLogicLayer.futureRtuProjectAreas
    ]);
    this.addLogicLayers(config.mapStyleDefinition, [
      MapLogicLayer.addresses,
      MapLogicLayer.interventions,
      MapLogicLayer.assetsPins
    ]);
    this.addLogicLayers(config.mapStyleDefinition, [
      MapLogicLayer.pastProjectPins,
      MapLogicLayer.presentProjectPins,
      MapLogicLayer.futureProjectPins,
      MapLogicLayer.canceledProjectPins,
      MapLogicLayer.plannedProjectPins,
      MapLogicLayer.postponedProjectPins,
      MapLogicLayer.finalOrderedProjectPins,
      MapLogicLayer.replannedProjectPins,
      MapLogicLayer.programmedProjectPins,
      MapLogicLayer.preliminaryOrderedProjectPins
    ]);
    this.addLogicLayers(config.mapStyleDefinition, [
      MapLogicLayer.pastRtuProjectPins,
      MapLogicLayer.presentRtuProjectPins,
      MapLogicLayer.futureRtuProjectPins
    ]);
    this.addLogicLayers(config.mapStyleDefinition, [MapLogicLayer.roadSectionsSelection]);
    this.addLogicLayers(config.mapStyleDefinition, [MapLogicLayer.tools]);
    this.addLogicLayers(config.mapStyleDefinition, [MapLogicLayer.circleComparison]);
  }

  private addLogicLayers(
    mapStyle: (string | ILayerConfig)[],
    layers: string[],
    user?: User,
    permission?: Permission
  ): void {
    if (permission && user && !user.hasPermission(permission)) {
      return;
    }

    mapStyle.push(...layers);
  }

  private async addAssetLogicLayers(mapStyle: (string | ILayerConfig)[], user: User): Promise<void> {
    if (user.hasPermission(Permission.ASSET_READ)) {
      const mapAssetLogicLayers = await this.taxonomyService
        .group(TaxonomyGroup.mapAssetLogicLayer)
        .pipe(take(1))
        .toPromise();

      const logicLayerIds = mapAssetLogicLayers.map(x => x.code);
      mapStyle.push(...logicLayerIds);
    }
  }

  private setRequestTransformation(config: IMapConfig): void {
    config.mapOptions.transformRequest = url => {
      const requestParameters: RequestParameters = { url };
      if (mapSourcesSecured.some(x => url.includes(`/${x}/`))) {
        requestParameters.url = url.replace('/vector-tiles/maps/', '/vector-tiles/secured/maps/');
        requestParameters.headers = {
          Authorization: `Bearer ${this.authenticationService.getAccessToken()}`
        };
      }
      return requestParameters;
    };
  }
}
