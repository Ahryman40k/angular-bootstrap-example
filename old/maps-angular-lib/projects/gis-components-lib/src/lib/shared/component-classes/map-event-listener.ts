import { Input, OnDestroy, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { MapComponent } from '../../map/map.component';

export abstract class MapEventListener implements OnDestroy, OnInit {
  @Input() public targetMap: MapComponent;
  private subscriptions: Subscription[] = [];

  // L'attribut ci-dessous devrait être définie dans une sous-classe de MapEventListener
  protected doneCallback: (e: any) => void;

  /**
   * On init:
   * Subscribes to mapClick event.
   */
  public ngOnInit() {
    if (this.targetMap) {
      if (this.targetMap.isLoaded) {
        this.onMapLoaded();
      } else {
        this.subscribeEvent('load', (isLoaded: boolean) => {
          if (isLoaded) {
            this.onMapLoaded();
          }
        });
      }
    } else {
      // tslint:disable-next-line: no-console
      console.error(
        'Erreur. Aucune composant vdm-map n\'a été passé à l outil. Assignez une carte avec l\'@input targetMap. Par exemple : <vdm-simple-selection [targetMap]="map"></vdm-simple-selection>'
      );
    }
  }

  protected onMapLoaded() {
    // stub
  }

  /**
   * Subscribes event
   * @param eventName
   * @param callback
   * @param [interactionMode]
   */
  protected subscribeEvent(eventName: string, callback: (e: any) => void, interactionMode?: string) {
    this.subscriptions.push(this.targetMap.subscribeEvent(eventName, interactionMode).subscribe(callback));
  }

  /**
   * On destroy
   * Takes care of unsubscribing everything
   */
  public ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
