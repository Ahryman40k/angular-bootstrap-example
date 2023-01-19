import { Component } from '@angular/core';

@Component({
  selector: 'app-map-legend',
  templateUrl: './map-legend.component.html'
})
export class MapLegendComponent {
  public navTabLinks = [
    {
      link: 'elements',
      active: true,
      label: 'Éléments de la carte'
    },
    {
      link: 'medals',
      active: false,
      label: "Médailles d'aménagement"
    },
    {
      link: 'acronyms',
      active: false,
      label: 'Acronymes'
    }
  ];
}
