import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/shared/components/base/base.component';

@Component({
  selector: 'app-map-legend-header',
  templateUrl: './map-legend-header.component.html'
})
export class MapLegendHeaderComponent extends BaseComponent {
  constructor(private readonly router: Router) {
    super();
  }

  public async onClose(): Promise<void> {
    await this.router.navigate(['/']);
  }
}
