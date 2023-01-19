import { Component } from '@angular/core';

@Component({
  selector: 'app-mapbox-popup',
  templateUrl: './mapbox-popup.component.html',
  styleUrls: ['./mapbox-popup.component.scss']
})
export class MapboxPopupComponent {
  public id: string;
  public title: string;
  public subTitle: string;
  public date: string;
  public estimate: number;
  public type: string;
  public className: string;
  public interventionRoute = '/interventions/';
  public assetRoute = '/asset/';
  public projectRoute = '/projects/';

  public detailUrl(): string {
    switch (this.className) {
      case 'intervention':
      case 'intervention-decision-required':
        return `window/interventions/${this.id}/overview`;
      case 'asset':
        return `map/asset/${this.id}`;
      default:
        return `window/projects/${this.id}/overview`;
    }
  }
}
