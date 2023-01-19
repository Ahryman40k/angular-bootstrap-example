import { Component } from '@angular/core';

@Component({
  selector: 'app-non-geolocated-projects-panel',
  templateUrl: './non-geolocated-projects-panel.component.html',
  styleUrls: ['./non-geolocated-projects-panel.component.scss']
})
export class NonGeolocatedProjectsPanelComponent {
  public shown = false;

  private setShown(shown: boolean): void {
    setTimeout(() => {
      this.shown = shown;
    });
  }

  public getToolTip(): string {
    return this.shown ? 'Fermer le panneau' : 'Visualiser les projets non-géolocalisés';
  }

  public togglePanel(): void {
    this.setShown(!this.shown);
  }
}
